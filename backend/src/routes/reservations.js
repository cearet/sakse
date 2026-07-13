import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { scheduleCycleJobs, scheduleReservationExpiry, cancelReservationExpiry } from "../lib/schedule.js";
import { minutesToMs, RESERVE_EXPIRE_MS } from "../lib/config.js";
import { promoteNextInWaitlist } from "../lib/waitlist.js";
import { cancelAndRefund } from "../lib/reservation.js";

const router = Router();

// A machine's QR sticker encodes this payload. Scanning it (to start or to
// collect) proves the user is physically at the right machine.
export function machineCode(machineId) {
  return `SAKSE-MACHINE:${machineId}`;
}
// Accept either the full payload or the bare id, and ignore surrounding space.
function codeMatches(scanned, machineId) {
  const v = String(scanned || "").trim();
  return v === machineCode(machineId) || v === machineId;
}

// GET /api/reservations/mine — the user's current active reservation (if any).
router.get("/mine", requireAuth, async (req, res) => {
  const reservation = await prisma.reservation.findFirst({
    where: { userId: req.userId, status: "ACTIVE" },
    include: { machine: { include: { laundromat: true } } },
    orderBy: { reservedAt: "desc" },
  });
  if (!reservation) return res.json(null);

  // Tell the client when a not-yet-started reservation auto-cancels, so it can
  // show a live countdown that matches the backend expiry job.
  const expiresAt =
    reservation.machine.status === "RESERVED"
      ? new Date(new Date(reservation.reservedAt).getTime() + RESERVE_EXPIRE_MS)
      : null;
  res.json({ ...reservation, expiresAt });
});

// POST /api/reservations  { machineId }
// Reserve an available machine and pay for it from the wallet — all in one
// atomic DB transaction so two people can't grab the same machine or overspend.
router.post("/", requireAuth, async (req, res) => {
  const { machineId } = req.body;
  if (!machineId) return res.status(400).json({ error: "machineId is required" });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const machine = await tx.machine.findUnique({ where: { id: machineId } });
      if (!machine) throw new Error("Machine not found");

      // Conditional update: only succeeds if the machine is still AVAILABLE.
      // If someone else booked it a moment ago, count === 0 and we bail out.
      const claimed = await tx.machine.updateMany({
        where: { id: machineId, status: "AVAILABLE" },
        data: { status: "RESERVED" },
      });
      if (claimed.count === 0) throw new Error("Machine is no longer available");

      const wallet = await tx.wallet.findUnique({ where: { userId: req.userId } });
      if (!wallet || wallet.balance < machine.pricePerCycle) {
        throw new Error("INSUFFICIENT_FUNDS");
      }

      // Deduct the fare and record the ledger entry.
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: machine.pricePerCycle } },
      });
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: "PAYMENT",
          amount: -machine.pricePerCycle,
          note: `Reserved ${machine.label}`,
        },
      });

      return tx.reservation.create({
        data: {
          userId: req.userId,
          machineId,
          paidAmount: machine.pricePerCycle,
          status: "ACTIVE",
        },
        include: { machine: { include: { laundromat: true } } },
      });
    });

    // Start the countdown to auto-cancel if they never come to scan & start.
    await scheduleReservationExpiry(result.id);

    res.json(result);
  } catch (err) {
    if (err.message === "INSUFFICIENT_FUNDS") {
      return res.status(402).json({ error: "Not enough balance — please top up." });
    }
    return res.status(409).json({ error: err.message });
  }
});

// POST /api/reservations/:id/start  { code } — user scanned the machine QR and
// loaded clothes; start the wash. Machine goes RESERVED -> RUNNING.
router.post("/:id/start", requireAuth, async (req, res) => {
  const reservation = await prisma.reservation.findFirst({
    where: { id: req.params.id, userId: req.userId, status: "ACTIVE" },
    include: { machine: true },
  });
  if (!reservation) return res.status(404).json({ error: "Reservation not found" });
  if (!codeMatches(req.body?.code, reservation.machineId)) {
    return res.status(409).json({ error: "That QR code isn't for your machine." });
  }
  if (reservation.machine.status !== "RESERVED") {
    return res.status(409).json({ error: "Wash can only be started from RESERVED" });
  }

  const now = new Date();
  // Uses the configurable time unit so the countdown matches the worker's timers.
  const doneAt = new Date(now.getTime() + minutesToMs(reservation.machine.cycleMinutes));

  const [, updated] = await prisma.$transaction([
    prisma.machine.update({
      where: { id: reservation.machineId },
      data: { status: "RUNNING" },
    }),
    prisma.reservation.update({
      where: { id: reservation.id },
      data: { startedAt: now, doneAt },
      include: { machine: { include: { laundromat: true } } },
    }),
  ]);

  // Wash is underway — drop the no-show auto-cancel, schedule the cycle jobs.
  await cancelReservationExpiry(reservation.id);
  await scheduleCycleJobs(reservation.id, reservation.machine.cycleMinutes);

  res.json(updated);
});

// POST /api/reservations/:id/collect  { code } — user scanned the machine QR to
// pick up their clothes. Only allowed once the wash has finished.
router.post("/:id/collect", requireAuth, async (req, res) => {
  const reservation = await prisma.reservation.findFirst({
    where: { id: req.params.id, userId: req.userId, status: "ACTIVE" },
    include: { machine: true },
  });
  if (!reservation) return res.status(404).json({ error: "Reservation not found" });

  if (!codeMatches(req.body?.code, reservation.machineId)) {
    return res.status(409).json({ error: "That QR code isn't for your machine." });
  }

  // Can only collect after the cycle is finished. The worker flips RUNNING->DONE
  // at cycle end; also accept the case where the time has elapsed but the worker
  // hasn't caught up yet.
  const timeUp = reservation.doneAt && new Date(reservation.doneAt) <= new Date();
  const finished = ["DONE", "OVERDUE"].includes(reservation.machine.status) || timeUp;
  if (!finished) {
    return res.status(409).json({ error: "Your wash isn't done yet — collect when the timer ends." });
  }

  // If a late fine was already charged, the reservation ends as FINED, else COMPLETED.
  const finalStatus = reservation.fineAmount > 0 ? "FINED" : "COMPLETED";

  const [, updated] = await prisma.$transaction([
    prisma.machine.update({
      where: { id: reservation.machineId },
      data: { status: "AVAILABLE" },
    }),
    prisma.reservation.update({
      where: { id: reservation.id },
      data: { status: finalStatus, collectedAt: new Date() },
    }),
  ]);

  // A machine just freed up — notify the next person waiting here.
  await promoteNextInWaitlist(reservation.machine.laundromatId);

  res.json(updated);
});

// POST /api/reservations/:id/cancel — cancel a reservation that hasn't started.
// Refunds the fare to the wallet and frees the machine.
router.post("/:id/cancel", requireAuth, async (req, res) => {
  const reservation = await prisma.reservation.findFirst({
    where: { id: req.params.id, userId: req.userId, status: "ACTIVE" },
    include: { machine: true },
  });
  if (!reservation) return res.status(404).json({ error: "Reservation not found" });
  if (reservation.machine.status !== "RESERVED") {
    return res.status(409).json({ error: "You can only cancel before the wash starts." });
  }

  await cancelReservationExpiry(reservation.id);
  const cancelled = await cancelAndRefund(reservation.id);
  res.json({ ok: true, refunded: cancelled?.paidAmount ?? 0 });
});

export default router;
