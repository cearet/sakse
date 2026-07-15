// Background worker — runs as its own process (`npm run worker`).
// Processes the timed wash-cycle events: notify, done, and overdue (late fine).
import "dotenv/config";
import { Worker } from "bullmq";
import { connection } from "./queue.js";
import { prisma } from "./prisma.js";
import { NOTIFY_BEFORE_MIN, GRACE_MIN, FINE_AMOUNT } from "./lib/config.js";
import { cancelAndRefund } from "./lib/reservation.js";
import { logInfo, logWarn } from "./lib/log.js";

async function notify(userId, title, body) {
  await prisma.notification.create({ data: { userId, title, body } });
}

const worker = new Worker(
  "cycle",
  async (job) => {
    const { reservationId } = job.data;
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { machine: true },
    });
    if (!reservation) return;
    const { machine } = reservation;

    // --- No-show: user never scanned to start; auto-cancel & refund ---
    if (job.name === "expire") {
      const cancelled = await cancelAndRefund(
        reservationId,
        `Auto-refund — didn't start ${machine.label} in time`
      );
      if (cancelled) {
        await notify(
          cancelled.userId,
          "Reservation cancelled",
          `You didn't scan to start ${machine.label} in time, so it was cancelled and ฿${(cancelled.paidAmount / 100).toFixed(2)} was refunded.`
        );
      }
      return;
    }

    // --- Almost done: nudge the user ---
    if (job.name === "notify") {
      if (reservation.status === "ACTIVE" && machine.status === "RUNNING") {
        await notify(
          reservation.userId,
          "Almost done",
          `Your wash in ${machine.label} finishes in about ${NOTIFY_BEFORE_MIN} minutes.`
        );
      }
      return;
    }

    // --- Cycle finished: machine -> DONE ---
    if (job.name === "done") {
      if (machine.status === "RUNNING") {
        await prisma.machine.update({ where: { id: machine.id }, data: { status: "DONE" } });
        await notify(
          reservation.userId,
          "Wash complete",
          `Please collect from ${machine.label} within ${GRACE_MIN} minutes to avoid a late fee.`
        );
        logInfo("machine.done", { machineId: machine.id, reservationId });
      }
      return;
    }

    // --- Grace expired: charge a late fine if still uncollected ---
    if (job.name === "overdue") {
      // Re-read to be sure it wasn't collected in the meantime.
      const fresh = await prisma.reservation.findUnique({
        where: { id: reservationId },
        include: { machine: true, user: { include: { wallet: true } } },
      });
      if (!fresh || fresh.status !== "ACTIVE" || fresh.collectedAt) return;
      if (fresh.machine.status !== "DONE") return;

      const wallet = fresh.user.wallet;
      await prisma.$transaction([
        prisma.machine.update({ where: { id: fresh.machineId }, data: { status: "OVERDUE" } }),
        prisma.reservation.update({ where: { id: fresh.id }, data: { fineAmount: FINE_AMOUNT } }),
        prisma.wallet.update({ where: { id: wallet.id }, data: { balance: { decrement: FINE_AMOUNT } } }),
        prisma.transaction.create({
          data: {
            walletId: wallet.id,
            type: "FINE",
            amount: -FINE_AMOUNT,
            note: `Late pickup fee — ${fresh.machine.label}`,
          },
        }),
      ]);
      await notify(
        fresh.userId,
        "Late pickup fee",
        `A ฿${(FINE_AMOUNT / 100).toFixed(2)} late fee was charged for ${fresh.machine.label}.`
      );
      logWarn("reservation.fined", { reservationId, userId: fresh.userId, fine: FINE_AMOUNT });
      return;
    }
  },
  { connection }
);

worker.on("ready", () => console.log("Sakse worker ready, listening for cycle jobs"));
worker.on("failed", (job, err) => console.error(`Job ${job?.name} failed:`, err.message));
