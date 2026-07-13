// Central place for cycle timing + fine settings.

// How long one "minute" of cycle time actually lasts, in real milliseconds.
// Production: 60000 (a real minute). For demos/tests set TIME_UNIT_MS=1000 so a
// "40-minute" wash finishes in 40 seconds and you can watch the whole flow.
export const TIME_UNIT_MS = Number(process.env.TIME_UNIT_MS || 60000);

// Notify the user this many cycle-minutes before the wash finishes.
export const NOTIFY_BEFORE_MIN = Number(process.env.NOTIFY_BEFORE_MINUTES || 5);

// Grace period after the wash is done before a late fine applies.
export const GRACE_MIN = Number(process.env.GRACE_MINUTES || 10);

// If the user doesn't scan to start within this many minutes of reserving, the
// reservation is auto-cancelled and refunded. This is a REAL-WORLD grace window,
// so it uses actual minutes — NOT the sped-up TIME_UNIT_MS cycle clock.
export const RESERVE_EXPIRE_MIN = Number(process.env.RESERVE_EXPIRE_MINUTES || 10);
export const RESERVE_EXPIRE_MS = RESERVE_EXPIRE_MIN * 60_000;

// Late pickup fine, in satang (฿20).
export const FINE_AMOUNT = Number(process.env.FINE_AMOUNT || 2000);

// Convert cycle-minutes to real milliseconds using the configured time unit.
export function minutesToMs(minutes) {
  return Math.round(minutes * TIME_UNIT_MS);
}
