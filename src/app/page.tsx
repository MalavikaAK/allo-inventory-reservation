"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  sku: string;
  name: string;
  stockByWarehouse: { warehouseId: string; warehouseCode: string; warehouseName: string; availableUnits: number }[];
};

type Theme = "theme-ocean" | "theme-sunset" | "theme-forest";

const themeOptions: { value: Theme; label: string }[] = [
  { value: "theme-ocean", label: "Ocean" },
  { value: "theme-sunset", label: "Sunset" },
  { value: "theme-forest", label: "Forest" },
];

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>("theme-ocean");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then(setProducts).catch(() => setError("Failed to load products"));
  }, []);

  useEffect(() => {
    document.body.classList.remove("theme-ocean", "theme-sunset", "theme-forest");
    document.body.classList.add(theme);
  }, [theme]);

  const firstRows = useMemo(() => products.flatMap((p) => p.stockByWarehouse.map((w) => ({ p, w }))), [products]);

  async function reserve(productId: string, warehouseId: string) {
    setError(null);
    const res = await fetch("/api/reservations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, warehouseId, quantity: 1 }) });
    const data = await res.json();
    if (!res.ok) return setError(data.message || "Reserve failed");
    router.push(`/reservations/${data.reservation.id}`);
  }

  return (
    <main className="max-w-5xl mx-auto p-6 md:p-10">
      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Allo Inventory</h1>
            <p className="muted">Reserve stock safely during checkout windows.</p>
          </div>
          <div className="flex gap-2">
            {themeOptions.map((option) => (
              <button key={option.value} className="glass-button px-3 py-2 rounded-lg text-sm" onClick={() => setTheme(option.value)}>
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="text-red-700 font-medium mb-4">{error}</p>}

      <div className="grid gap-4">
        {firstRows.map(({ p, w }) => (
          <div key={`${p.id}-${w.warehouseId}`} className="glass-card rounded-xl p-4">
            <p className="font-semibold text-lg">{p.name} <span className="muted text-sm">({p.sku})</span></p>
            <p className="muted mt-1">{w.warehouseName} ({w.warehouseCode})</p>
            <p className="mt-1">Available: <span className="accent font-semibold">{w.availableUnits}</span></p>
            <button className="glass-button mt-3 px-4 py-2 rounded-lg" disabled={w.availableUnits < 1} onClick={() => reserve(p.id, w.warehouseId)}>
              Reserve
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
