import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({ where: { id } });
    if (!reservation) return { status: 404 as const, body: { message: "Reservation not found" } };
    if (reservation.status !== "PENDING") return { status: 200 as const, body: { reservation } };

    await tx.inventory.update({
      where: { productId_warehouseId: { productId: reservation.productId, warehouseId: reservation.warehouseId } },
      data: { reservedUnits: { decrement: reservation.quantity } },
    });

    const released = await tx.reservation.update({ where: { id }, data: { status: "RELEASED", releasedAt: now, releaseReason: "cancelled" } });
    return { status: 200 as const, body: { reservation: released } };
  }, { isolationLevel: "Serializable" });

  return NextResponse.json(result.body, { status: result.status });
}
