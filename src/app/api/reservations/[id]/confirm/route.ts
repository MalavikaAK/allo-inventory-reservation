import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { releaseExpiredReservations } from "@/lib/reservations";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await releaseExpiredReservations();
  const { id } = await params;

  const idem = req.headers.get("Idempotency-Key");
  if (idem) {
    const cached = await redis.get<string>(`idem:confirm:${id}:${idem}`);
    if (cached) return NextResponse.json(JSON.parse(cached));
  }

  const now = new Date();
  const result = await prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({ where: { id } });
    if (!reservation) return { status: 404 as const, body: { message: "Reservation not found" } };
    if (reservation.status === "CONFIRMED") return { status: 200 as const, body: { reservation } };
    if (reservation.status !== "PENDING" || reservation.expiresAt <= now) return { status: 410 as const, body: { message: "Reservation expired" } };

    await tx.inventory.update({
      where: { productId_warehouseId: { productId: reservation.productId, warehouseId: reservation.warehouseId } },
      data: { reservedUnits: { decrement: reservation.quantity }, totalUnits: { decrement: reservation.quantity } },
    });

    const confirmed = await tx.reservation.update({ where: { id }, data: { status: "CONFIRMED", confirmedAt: now } });
    return { status: 200 as const, body: { reservation: confirmed } };
  }, { isolationLevel: "Serializable" });

  if (idem && result.status === 200) {
    await redis.set(`idem:confirm:${id}:${idem}`, JSON.stringify(result.body), { ex: 3600 });
  }

  return NextResponse.json(result.body, { status: result.status });
}
