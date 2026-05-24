"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ReservationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [reservation, setReservation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/products");
    const timer = setInterval(async () => {
      const res = await fetch(`/api/reservations/${id}/confirm`, { method: "POST", headers: { "x-probe": "1" } });
      if (res.status === 410) setError("Reservation expired");
    }, 15000);
    return () => clearInterval(timer);
  }, [id]);

  const expiresIn = useMemo(() => {
    if (!reservation?.expiresAt) return "--";
    const secs = Math.max(0, Math.floor((new Date(reservation.expiresAt).getTime() - Date.now()) / 1000));
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }, [reservation]);

  async function confirm() {
    const res = await fetch(`/api/reservations/${id}/confirm`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) return setError(data.message || "Confirm failed");
    setReservation(data.reservation);
  }

  async function cancel() {
    const res = await fetch(`/api/reservations/${id}/release`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) return setError(data.message || "Cancel failed");
    setReservation(data.reservation);
    router.push("/");
  }

  return <main className="p-8"><h1 className="text-2xl font-bold mb-3">Reservation {id}</h1><p className="mb-3">Expires in: {expiresIn}</p>{error && <p className="text-red-600 mb-3">{error}</p>}<div className="flex gap-3"><button onClick={confirm} className="px-3 py-1 bg-green-700 text-white rounded">Confirm purchase</button><button onClick={cancel} className="px-3 py-1 bg-gray-700 text-white rounded">Cancel</button></div></main>;
}
