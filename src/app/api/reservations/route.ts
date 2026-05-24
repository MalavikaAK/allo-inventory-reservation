import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createReservationSchema } from "@/lib/schemas";
import { redis } from "@/lib/redis";
import { releaseExpiredReservations } from "@/lib/reservations";

const RESERVE_TTL_SECONDS = 600;

export async function POST(req: NextRequest) {
  await releaseExpiredReservations();
  const payload = createReservationSchema.parse(await req.json());

  const idem = req.headers.get("Idempotency-Key");
  if (idem) {
    const cached = await redis.get<string>(`idem:reserve:${idem}`);
    if (cached) return NextResponse.json(JSON.parse(cached), { status: 201 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.$executeRaw`
      UPDATE "Inventory"
      SET "reservedUnits" = "reservedUnits" + ${payload.quantity}
      WHERE "productId" = ${payload.productId}
        AND "warehouseId" = ${payload.warehouseId}
        AND ("totalUnits" - "reservedUnits") >= ${payload.quantity}
    `;

    if (updated === 0) {
      return { status: 409 as const, body: { message: "Not enough stock" } };
    }

    const reservation = await tx.reservation.create({
      data: {
        productId: payload.productId,
        warehouseId: payload.warehouseId,
        quantity: payload.quantity,
        status: "PENDING",
        expiresAt: new Date(Date.now() + RESERVE_TTL_SECONDS * 1000),
      },
    });

    return { status: 201 as const, body: { reservation } };
  }, { isolationLevel: "Serializable" });

  if (idem && result.status === 201) {
    await redis.set(`idem:reserve:${idem}`, JSON.stringify(result.body), { ex: 3600 });
  }

  return NextResponse.json(result.body, { status: result.status });
}
