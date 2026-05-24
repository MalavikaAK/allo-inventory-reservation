import { NextResponse } from "next/server";
import { releaseExpiredReservations } from "@/lib/reservations";

export async function GET() {
  await releaseExpiredReservations();
  return NextResponse.json({ ok: true, message: "Expired reservations released" });
}
