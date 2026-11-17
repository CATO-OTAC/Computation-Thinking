"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Users, ArrowRight, PlusCircle } from "lucide-react";

interface TripSummary {
  id: string;
  title: string;
  destinationMode: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  groupSize: number;
  budgetMaxVnd: number;
  projectedTotalVnd: number;
  status: string;
}

export default function MyTripsPage() {
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/trips")
      .then((r) => r.json())
      .then((d) => setTrips(d.trips || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-12 text-center text-sm text-slate-500">Loading your trips...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Saved Trip Plans</h1>
          <p className="text-xs text-slate-600">Inspect itineraries, re-balance budgets, or submit post-trip reviews.</p>
        </div>
        <Link
          href="/planner"
          className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700"
        >
          <PlusCircle className="h-4 w-4" /> New Trip
        </Link>
      </div>

      {trips.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center text-sm text-slate-600">
          No saved trips yet. Launch the Smart Trip Wizard or clone a community plan!
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trips.map((t) => (
            <Link
              key={t.id}
              href={`/trips/${t.id}`}
              className="glass-card rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="rounded-full bg-sky-100 px-2.5 py-0.5 font-semibold text-sky-800">
                    {t.destinationMode}
                  </span>
                  <span className="font-semibold text-slate-500">{t.status}</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">{t.title}</h2>
                <div className="flex gap-4 text-xs text-slate-600">
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {t.durationDays}D ({t.startDate})</span>
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {t.groupSize}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                <div>
                  <span className="text-slate-500">Projected: </span>
                  <span className="font-bold text-emerald-700">
                    {t.projectedTotalVnd.toLocaleString("vi-VN")} / {t.budgetMaxVnd.toLocaleString("vi-VN")} VND
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-teal-600" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}