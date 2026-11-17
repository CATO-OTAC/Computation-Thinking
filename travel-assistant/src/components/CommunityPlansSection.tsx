"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Copy, Star, Users, Calendar, ArrowRight } from "lucide-react";

interface CommunityPlan {
  id: string;
  title: string;
  destinationMode: string;
  durationDays: number;
  groupSize: number;
  budgetMaxVnd: number;
  projectedTotalVnd: number;
  selectedVibes: string;
  avgRating: number;
  reviewCount: number;
  cloneCount: number;
  user: { name: string };
}

export default function CommunityPlansSection() {
  const [plans, setPlans] = useState<CommunityPlan[]>([]);
  const [cloningId, setCloningId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/trips/community")
      .then((r) => r.json())
      .then((d) => setPlans(d.plans || []))
      .catch(() => {});
  }, []);

  async function handleClone(planId: string) {
    setCloningId(planId);
    const res = await fetch(`/api/trips/${planId}/clone`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setCloningId(null);
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    const data = await res.json();
    if (data.tripId) {
      router.push(`/trips/${data.tripId}`);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
            Feedback-Driven Rankings
          </span>
          <h2 className="text-2xl font-bold text-slate-900">Top Rated & Most Content Community Plans</h2>
        </div>
        <Link href="/planner" className="text-sm font-semibold text-teal-700 hover:underline flex items-center gap-1">
          Build Custom Plan <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {plans.map((p) => {
          const vibes: string[] = JSON.parse(p.selectedVibes || "[]");
          return (
            <div key={p.id} className="glass-card flex flex-col justify-between rounded-2xl p-5 shadow-sm hover:shadow-md transition">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-800">
                    {p.destinationMode === "BOTH"
                      ? "Da Lat + Nha Trang"
                      : p.destinationMode === "DA_LAT"
                      ? "Da Lat"
                      : "Nha Trang"}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-600">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                    {p.avgRating.toFixed(1)} ({p.reviewCount})
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 leading-snug">{p.title}</h3>

                <div className="flex flex-wrap gap-1.5">
                  {vibes.map((v) => (
                    <span key={v} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                      #{v}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-slate-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-teal-600" /> {p.durationDays} Days
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-teal-600" /> {p.groupSize} Travelers
                  </span>
                </div>
                <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs">
                  <span className="text-slate-600">Projected Cost: </span>
                  <span className="font-bold text-emerald-700">
                    {p.projectedTotalVnd.toLocaleString("vi-VN")} VND
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                <Link
                  href={`/trips/${p.id}`}
                  className="flex-1 rounded-lg border border-slate-300 py-2 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Inspect Plan
                </Link>
                <button
                  onClick={() => handleClone(p.id)}
                  disabled={cloningId === p.id}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-teal-600 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {cloningId === p.id ? "Cloning..." : `Clone (${p.cloneCount})`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}