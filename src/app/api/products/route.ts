import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { releaseExpiredReservations } from "@/lib/reservations";

export async function GET() {
  await releaseExpiredReservations();
  const products = await prisma.product.findMany({ include: { inventory: { include: { warehouse: true } } } });
  return NextResponse.json(products.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    stockByWarehouse: p.inventory.map((inv) => ({
      warehouseId: inv.warehouseId,
      warehouseName: inv.warehouse.name,
      warehouseCode: inv.warehouse.code,
      totalUnits: inv.totalUnits,
      reservedUnits: inv.reservedUnits,
      availableUnits: inv.totalUnits - inv.reservedUnits,
    })),
  })));
}
