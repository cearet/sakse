import "dotenv/config";
import express from "express";
import cors from "cors";
import { prisma } from "./prisma.js";
import authRoutes from "./routes/auth.js";
import meRoutes from "./routes/me.js";
import laundromatRoutes from "./routes/laundromats.js";
import walletRoutes from "./routes/wallet.js";
import reservationRoutes from "./routes/reservations.js";
import notificationRoutes from "./routes/notifications.js";
import routeRoutes from "./routes/route.js";
import waitlistRoutes from "./routes/waitlist.js";
import { logError } from "./lib/log.js";

const app = express();

app.use(cors());
app.use(express.json());

// Health check — confirms the server and DB connection are alive.
app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: "connected" });
  } catch (err) {
    res.status(500).json({ ok: false, db: "error", error: String(err) });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/me", meRoutes);
app.use("/api/laundromats", laundromatRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/route", routeRoutes);
app.use("/api/waitlist", waitlistRoutes);

// Catch-all: record any unhandled error in the audit log, then respond.
app.use((err, req, res, _next) => {
  logError("unhandled.error", { path: req.path, message: err.message });
  res.status(500).json({ error: "Something went wrong" });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Sakse backend running on http://localhost:${port}`);
});
