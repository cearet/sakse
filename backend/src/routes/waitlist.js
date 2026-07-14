import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { logInfo } from "../lib/log.js";

const router = Router();

const ACTIVE = ["WAITING", "NOTIFIED"];

// Compute a friendly 1-based position for a waitlist entry (how many active
// entries at the same laundromat joined before it, inclusive).
async function positionOf(entry) {
  const ahead = await prisma.waitlistEntry.count({
    where: {
      laundromatId: entry.laundromatId,
      status: { in: ACTIVE },
      createdAt: { lte: entry.createdAt },
    },
  });
  return ahead;
}

// GET /api/waitlist/mine — the user's active waitlist entries with position.
router.get("/mine", requireAuth, async (req, res) => {
  const items = await prisma.waitlistEntry.findMany({
    where: { userId: req.userId, status: { in: ACTIVE } },
    include: { laundromat: true },
    orderBy: { createdAt: "asc" },
  });
  const withPos = await Promise.all(
    items.map(async (e) => ({ ...e, position: await positionOf(e) }))
  );
  res.json(withPos);
});

// POST /api/waitlist  { laundromatId } — join the queue at a laundromat.
router.post("/", requireAuth, async (req, res) => {
  const { laundromatId } = req.body;
  if (!laundromatId) return res.status(400).json({ error: "laundromatId is required" });

  const laundromat = await prisma.laundromat.findUnique({ where: { id: laundromatId } });
  if (!laundromat) return res.status(404).json({ error: "Laundromat not found" });

  // Already queued here? Return the existing entry.
  const existing = await prisma.waitlistEntry.findFirst({
    where: { userId: req.userId, laundromatId, status: { in: ACTIVE } },
  });
  if (existing) {
    return res.json({ ...existing, position: await positionOf(existing) });
  }

  const count = await prisma.waitlistEntry.count({
    where: { laundromatId, status: { in: ACTIVE } },
  });
  const entry = await prisma.waitlistEntry.create({
    data: { userId: req.userId, laundromatId, position: count + 1, status: "WAITING" },
  });
  logInfo("waitlist.joined", { userId: req.userId, laundromatId, position: count + 1 });
  res.json({ ...entry, position: count + 1 });
});

// POST /api/waitlist/:id/leave — leave the queue.
router.post("/:id/leave", requireAuth, async (req, res) => {
  await prisma.waitlistEntry.updateMany({
    where: { id: req.params.id, userId: req.userId },
    data: { status: "EXPIRED" },
  });
  logInfo("waitlist.left", { userId: req.userId, entryId: req.params.id });
  res.json({ ok: true });
});

export default router;
