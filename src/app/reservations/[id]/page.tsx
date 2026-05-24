"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Reservation = {
  id: string;
  status: "PENDING" | "CONFIRMED" | "RELEASED";
  expiresAt: string;
};

export default function ReservationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  const loadReservation = useCallback(async () => {
    const res = await fetch(`/api/reservations/${id}`, { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) return setError(data.message || "Failed to load reservation");
    setReservation(data.reservation);
  }, [id]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    const poll = setInterval(() => {
      loadReservation();
    }, 5000);
    const kickoff = setTimeout(() => {
      loadReservation();
    }, 0);

    return () => {
      clearInterval(t);
      clearInterval(poll);
      clearTimeout(kickoff);
    };
  }, [loadReservation]);

  const expiresIn = reservation
    ? Math.max(0, Math.floor((new Date(reservation.expiresAt).getTime() - now) / 1000))
    : 0;

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

  return (
    <main className="max-w-3xl mx-auto p-6 md:p-10">
      <div className="glass-card rounded-2xl p-6">
        <h1 className="text-2xl font-bold mb-2">Reservation {id}</h1>
        <p className="mb-1">Status: <span className="accent font-semibold">{reservation?.status ?? "loading"}</span></p>
        <p className="mb-4 muted">Expires in: {Math.floor(expiresIn / 60)}:{String(expiresIn % 60).padStart(2, "0")}</p>
        {error && <p className="text-red-700 font-medium mb-4">{error}</p>}
        <div className="flex gap-3">
          <button onClick={confirm} className="glass-button px-4 py-2 rounded-lg" disabled={reservation?.status !== "PENDING"}>Confirm purchase</button>
          <button onClick={cancel} className="glass-button px-4 py-2 rounded-lg" disabled={reservation?.status !== "PENDING"}>Cancel</button>
        </div>
      </div>
    </main>
  );
}
