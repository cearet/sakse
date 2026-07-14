import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// GET /api/me — returns the logged-in user and their wallet balance.
// The frontend uses this after login to know who is signed in and whether
// to nudge them to top up (balance === 0).
router.get("/", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: { wallet: true },
  });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    balance: user.wallet?.balance ?? 0,
  });
});

export default router;
