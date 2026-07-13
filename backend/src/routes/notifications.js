import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// GET /api/notifications — latest notifications for the user.
router.get("/", requireAuth, async (req, res) => {
  const items = await prisma.notification.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  res.json(items);
});

// POST /api/notifications/read — mark all as read.
router.post("/read", requireAuth, async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.userId, read: false },
    data: { read: true },
  });
  res.json({ ok: true });
});

export default router;
