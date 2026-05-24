import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.reservation.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();

  const [w1, w2] = await Promise.all([
    prisma.warehouse.create({ data: { code: "BLR", name: "Bangalore FC" } }),
    prisma.warehouse.create({ data: { code: "DEL", name: "Delhi FC" } }),
  ]);

  const products = await Promise.all([
    prisma.product.create({ data: { sku: "SKU-TSHIRT-001", name: "Allo Tee" } }),
    prisma.product.create({ data: { sku: "SKU-HOODIE-002", name: "Allo Hoodie" } }),
  ]);

  await prisma.inventory.createMany({
    data: [
      { productId: products[0].id, warehouseId: w1.id, totalUnits: 5, reservedUnits: 0 },
      { productId: products[0].id, warehouseId: w2.id, totalUnits: 3, reservedUnits: 0 },
      { productId: products[1].id, warehouseId: w1.id, totalUnits: 4, reservedUnits: 0 },
      { productId: products[1].id, warehouseId: w2.id, totalUnits: 2, reservedUnits: 0 },
    ],
  });
}

main().finally(async () => {
  await prisma.$disconnect();
});
