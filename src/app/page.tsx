"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  sku: string;
  name: string;
  stockByWarehouse: { warehouseId: string; warehouseCode: string; warehouseName: string; availableUnits: number }[];
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then(setProducts).catch(() => setError("Failed to load products"));
  }, []);

  const firstRows = useMemo(() => products.flatMap((p) => p.stockByWarehouse.map((w) => ({ p, w }))), [products]);

  async function reserve(productId: string, warehouseId: string) {
    setError(null);
    const res = await fetch("/api/reservations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, warehouseId, quantity: 1 }) });
    const data = await res.json();
    if (!res.ok) return setError(data.message || "Reserve failed");
    router.push(`/reservations/${data.reservation.id}`);
  }

  return <main className="p-8"><h1 className="text-2xl font-bold mb-4">Inventory</h1>{error && <p className="text-red-600 mb-3">{error}</p>}<div className="space-y-2">{firstRows.map(({ p, w }) => <div key={`${p.id}-${w.warehouseId}`} className="border p-3 rounded"><p className="font-semibold">{p.name} ({p.sku})</p><p>{w.warehouseName} ({w.warehouseCode}) - Available: {w.availableUnits}</p><button className="mt-2 px-3 py-1 bg-black text-white rounded disabled:opacity-50" disabled={w.availableUnits < 1} onClick={() => reserve(p.id, w.warehouseId)}>Reserve</button></div>)}</div></main>;
}
