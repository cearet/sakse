import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma.js";
import { signToken } from "../middleware/auth.js";

const router = Router();

// Shape the user object we send to the frontend (never expose the password hash).
function publicUser(u) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    phone: u.phone,
    balance: u.wallet?.balance ?? 0,
  };
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { email, name, password, phone } = req.body;
  if (!email || !name || !password) {
    return res.status(400).json({ error: "email, name and password are required" });
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "Email already registered" });

  const passwordHash = await bcrypt.hash(password, 10);
  // Every new user automatically gets an empty wallet.
  const user = await prisma.user.create({
    data: {
      email,
      name,
      phone: phone || null,
      passwordHash,
      wallet: { create: {} },
    },
    include: { wallet: true },
  });

  const token = signToken(user.id);
  res.json({ token, user: publicUser(user) });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }
  const user = await prisma.user.findUnique({
    where: { email },
    include: { wallet: true },
  });
  // Same generic message whether the email or password is wrong (don't leak which).
  if (!user) return res.status(401).json({ error: "Invalid email or password" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid email or password" });

  const token = signToken(user.id);
  res.json({ token, user: publicUser(user) });
});

export default router;
