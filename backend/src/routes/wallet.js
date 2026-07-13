import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// All amounts are in satang (฿1 = 100 satang).

// GET /api/wallet — balance + recent transactions.
router.get("/", requireAuth, async (req, res) => {
  const wallet = await prisma.wallet.findUnique({
    where: { userId: req.userId },
    include: { transactions: { orderBy: { createdAt: "desc" }, take: 20 } },
  });
  if (!wallet) return res.status(404).json({ error: "Wallet not found" });
  res.json(wallet);
});

// POST /api/wallet/topup  { amount }  (amount in satang)
// MOCK top-up: in production this is where PromptPay + a webhook would credit
// the wallet. For now we just add the money directly.
router.post("/topup", requireAuth, async (req, res) => {
  const amount = Number(req.body.amount);
  if (!Number.isInteger(amount) || amount <= 0) {
    return res.status(400).json({ error: "amount (satang) must be a positive integer" });
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId: req.userId } });
  if (!wallet) return res.status(404).json({ error: "Wallet not found" });

  // Update balance and record the ledger entry together.
  const [updated] = await prisma.$transaction([
    prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: amount } },
    }),
    prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type: "TOPUP",
        amount, // positive = credit
        gatewayRef: `MOCK-${Date.now()}`,
        note: "Mock PromptPay top-up",
      },
    }),
  ]);

  res.json({ balance: updated.balance });
});

export default router;
