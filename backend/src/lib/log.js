import { prisma } from "../prisma.js";

// Append-only audit log → the Log table. Fire-and-forget: a logging failure must
// never break the request that triggered it, so we don't await and we swallow
// errors (after printing them to the server console).
export function logEvent(level, message, meta) {
  prisma.log
    .create({ data: { level, message, meta: meta ?? undefined } })
    .catch((err) => console.error("log write failed:", err.message));
}

export const logInfo = (message, meta) => logEvent("info", message, meta);
export const logWarn = (message, meta) => logEvent("warn", message, meta);
export const logError = (message, meta) => logEvent("error", message, meta);
