import { Queue } from "bullmq";
import IORedis from "ioredis";

// Shared Redis connection for BullMQ (queue + worker).
// maxRetriesPerRequest: null is required by BullMQ.
export const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

// One queue for all wash-cycle timed events (notify / done / overdue).
export const cycleQueue = new Queue("cycle", { connection });
