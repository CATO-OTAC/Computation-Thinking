import Link from "next/link";
import { Compass, Cpu, DollarSign, MapPin, ShieldAlert, Sparkles } from "lucide-react";
import CommunityPlansSection from "@/components/CommunityPlansSection";

export default function HomePage() {
  return (
    <div className="space-y-12 pb-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-teal-900 to-sky-900 px-6 py-12 text-white shadow-xl sm:px-12 sm:py-16">
        <div className="max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold text-teal-200 backdrop-blur">
            <Cpu className="h-3.5 w-3.5" /> Computational Thinking Travel Engine
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
            Smart Travel Planning for <span className="text-teal-300">Da Lat</span> &{" "}
            <span className="text-sky-300">Nha Trang</span>
          </h1>
          <p className="text-sm text-slate-200 sm:text-base leading-relaxed">
            Eliminate zigzag routes and budget overruns. Travel Assistant combines{" "}
            <strong>Jaccard Vibe Matching</strong>, <strong>Spatial Clustering + Greedy TSPTW</strong>, and a{" "}
            <strong>Strict Hard-Ceiling Budget Allocator</strong> to craft personalized itineraries with rainy-day
            indoor backups.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/planner"
              className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-teal-400 transition"
            >
              <Sparkles className="h-4 w-4" /> Start Planning Now
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-white/25 transition"
            >
              Demo Traveler / Manager Login
            </Link>
          </div>
        </div>
      </section>

      {/* Core CT Modules Grid */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: Compass,
            title: "Jaccard Similarity",
            desc: "Fair vibe-tag matching J(U, D) adjusted by real traveler review ratings.",
          },
          {
            icon: MapPin,
            title: "Spatial Clustering + TSPTW",
            desc: "Groups nearby attractions per day and respects exact opening/closing windows.",
          },
          {
            icon: DollarSign,
            title: "Hard Ceiling (B_max)",
            desc: "Pre-allocates 5 categories so early splurges never bankrupt later days.",
          },
          {
            icon: ShieldAlert,
            title: "Weather & Indoor Backups",
            desc: "Highland fog & coastal UV advisories with 1-click rainy-day indoor swaps.",
          },
        ].map((f, idx) => (
          <div key={idx} className="glass-card rounded-2xl p-5 shadow-sm">
            <f.icon className="mb-3 h-7 w-7 text-teal-600" />
            <h3 className="font-bold text-slate-900">{f.title}</h3>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Community Showcase */}
      <CommunityPlansSection />
    </div>
  );
}