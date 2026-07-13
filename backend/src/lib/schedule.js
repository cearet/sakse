import { cycleQueue } from "../queue.js";
import { minutesToMs, NOTIFY_BEFORE_MIN, GRACE_MIN, RESERVE_EXPIRE_MS } from "./config.js";

// When a machine is reserved, schedule an auto-cancel in case the user never
// shows up to scan the QR and start. Uses real minutes (not the sped-up cycle
// clock). Cancelled + removed once the wash starts.
export async function scheduleReservationExpiry(reservationId) {
  await cycleQueue.add(
    "expire",
    { reservationId },
    {
      removeOnComplete: true,
      removeOnFail: true,
      delay: RESERVE_EXPIRE_MS,
      jobId: `expire-${reservationId}`,
    }
  );
}

// The user started the wash (or cancelled) — drop the pending auto-cancel job.
export async function cancelReservationExpiry(reservationId) {
  await cycleQueue.remove(`expire-${reservationId}`).catch(() => {});
}

// When a wash starts, schedule the three timed events for it.
// jobIds are deterministic so re-scheduling can't create duplicates.
export async function scheduleCycleJobs(reservationId, cycleMinutes) {
  const cycleMs = minutesToMs(cycleMinutes);
  const notifyDelay = Math.max(cycleMs - minutesToMs(NOTIFY_BEFORE_MIN), 0);
  const overdueDelay = cycleMs + minutesToMs(GRACE_MIN);

  const opts = { removeOnComplete: true, removeOnFail: true };

  await cycleQueue.add("notify", { reservationId }, { ...opts, delay: notifyDelay, jobId: `notify-${reservationId}` });
  await cycleQueue.add("done", { reservationId }, { ...opts, delay: cycleMs, jobId: `done-${reservationId}` });
  await cycleQueue.add("overdue", { reservationId }, { ...opts, delay: overdueDelay, jobId: `overdue-${reservationId}` });
}
