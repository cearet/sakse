import { prisma } from "../prisma.js";
import { promoteNextInWaitlist } from "./waitlist.js";
import { logInfo } from "./log.js";

// Cancel a not-yet-started reservation: refund the fare, free the machine, and
// notify the next person waiting. Returns the reservation if it was cancelled,
// or null if it was no longer cancellable (already started/ended).
export async function cancelAndRefund(reservationId, note) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { machine: true },
  });
  if (!reservation || reservation.status !== "ACTIVE" || reservation.machine.status !== "RESERVED") {
    return null;
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId: reservation.userId } });

  await prisma.$transaction([
    prisma.machine.update({
      where: { id: reservation.machineId },
      data: { status: "AVAILABLE" },
    }),
    prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: reservation.paidAmount } },
    }),
    prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type: "REFUND",
        amount: reservation.paidAmount,
        note: note || `Refund — cancelled ${reservation.machine.label}`,
      },
    }),
    prisma.reservation.update({
      where: { id: reservation.id },
      data: { status: "CANCELLED" },
    }),
  ]);

  await promoteNextInWaitlist(reservation.machine.laundromatId);
  logInfo("reservation.refunded", {
    reservationId: reservation.id,
    userId: reservation.userId,
    amount: reservation.paidAmount,
    reason: note || "cancelled",
  });
  return reservation;
}
