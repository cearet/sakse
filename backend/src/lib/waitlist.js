import { prisma } from "../prisma.js";
import { logInfo } from "./log.js";

// Called when a machine frees up. Notifies the person who has waited longest
// at that laundromat that a machine is now available.
export async function promoteNextInWaitlist(laundromatId) {
  const next = await prisma.waitlistEntry.findFirst({
    where: { laundromatId, status: "WAITING" },
    orderBy: { createdAt: "asc" },
    include: { laundromat: true },
  });
  if (!next) return;

  await prisma.waitlistEntry.update({
    where: { id: next.id },
    data: { status: "NOTIFIED" },
  });
  await prisma.notification.create({
    data: {
      userId: next.userId,
      title: "A machine is free 🎉",
      body: `A washing machine just freed up at ${next.laundromat.name}. Reserve it now!`,
    },
  });
  logInfo("waitlist.promoted", { laundromatId, userId: next.userId, entryId: next.id });
}
