import { prisma } from "./prisma";

export async function releaseExpiredReservations() {
  const now = new Date();
  const expired = await prisma.reservation.findMany({ where: { status: "PENDING", expiresAt: { lte: now } } });
  for (const reservation of expired) {
    await prisma.$transaction(async (tx) => {
      const current = await tx.reservation.findUnique({ where: { id: reservation.id } });
      if (!current || current.status !== "PENDING" || current.expiresAt > now) return;
      await tx.inventory.updateMany({
        where: { productId: current.productId, warehouseId: current.warehouseId },
        data: { reservedUnits: { decrement: current.quantity } },
      });
      await tx.reservation.update({ where: { id: current.id }, data: { status: "RELEASED", releasedAt: now, releaseReason: "expired" } });
    });
  }
}
