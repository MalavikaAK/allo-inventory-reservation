import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { releaseExpiredReservations } from "@/lib/reservations";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await releaseExpiredReservations();
  const { id } = await params;
  const reservation = await prisma.reservation.findUnique({ where: { id } });
  if (!reservation) return NextResponse.json({ message: "Reservation not found" }, { status: 404 });
  return NextResponse.json({ reservation });
}
