"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Sparkles, ArrowRight, ArrowLeft } from "lucide-react";
import CommunityPlansSection from "@/components/CommunityPlansSection";

const VIBE_OPTIONS = [
  "romantic",
  "nature",
  "chill",
  "adventure",
  "beach",
  "coffee",
  "nightlife",
  "family-friendly",
  "photography",
];

export default function PlannerPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [title, setTitle] = useState("");
  const [destinationMode, setDestinationMode] = useState<"DA_LAT" | "NHA_TRANG" | "BOTH">("BOTH");
  const [startDate, setStartDate] = useState("2025-06-15");
  const [endDate, setEndDate] = useState("2025-06-18");
  const [groupSize, setGroupSize] = useState(2);
  const [budgetMaxVnd, setBudgetMaxVnd] = useState(9_000_000);
  const [vibes, setVibes] = useState<string[]>(["nature", "coffee", "photography", "beach"]);
  const [requirements, setRequirements] = useState({
    wheelchairAccessible: false,
    vegetarian: false,
    noEarlyMornings: false,
  });
  const [isPublicCommunity, setIsPublicCommunity] = useState(true);

  const [feasibility, setFeasibility] = useState<{
    valid: boolean;
    feasible: boolean;
    durationDays: number;
    minRecommendedBudgetVnd: number;
    errors: string[];
    warnings: string[];
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const timer = setTimeout(async () => {
      const res = await fetch("/api/trips/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkOnly: true,
          destinationMode,
          startDate,
          endDate,
          groupSize,
          budgetMaxVnd,
          vibes,
          requirements,
        }),
      });
      if (res.ok) {
        setFeasibility(await res.json());
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [destinationMode, startDate, endDate, groupSize, budgetMaxVnd, vibes, requirements]);

  function toggleVibe(v: string) {
    setVibes((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    setSubmitting(true);

    const res = await fetch("/api/trips/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        destinationMode,
        startDate,
        endDate,
        groupSize,
        budgetMaxVnd,
        vibes,
        requirements,
        isPublicCommunity,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (res.status === 401) {
      router.push("/login");
      return;
    }
    if (!res.ok) {
      setSubmitError(data.feasibility?.errors?.join(" ") || data.error || "Could not generate trip.");
      return;
    }

    router.push(`/trips/${data.tripId}`);
  }

  return (
    <div className="space-y-12 pb-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Smart Trip Wizard</h1>
            <p className="text-sm text-slate-600">
              Powered by Module A Feasibility, Module B Jaccard, Module C Budget Ceiling & Module D TSPTW.
            </p>
          </div>
          <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-800">
            Step {step} of 2
          </span>
        </div>

        <form onSubmit={handleGenerate} className="glass-card rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
          {step === 1 ? (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  1. Select Destination Mode
                </label>
                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    { id: "DA_LAT", label: "Da Lat Only", sub: "Cool pine highlands & cafes" },
                    { id: "NHA_TRANG", label: "Nha Trang Only", sub: "Turquoise bay & islands" },
                    { id: "BOTH", label: "Da Lat + Nha Trang", sub: "Combined w/ shuttle transfer" },
                  ].map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setDestinationMode(opt.id as "DA_LAT" | "NHA_TRANG" | "BOTH")}
                      className={`rounded-2xl border p-4 text-left transition ${
                        destinationMode === opt.id
                          ? "border-teal-600 bg-teal-50 ring-2 ring-teal-500/30"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="font-bold text-slate-900 text-sm">{opt.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{opt.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Trip Title (Optional)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Summer Highlands & Coast Getaway"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Group Size</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={groupSize}
                    onChange={(e) => setGroupSize(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    Hard Budget Ceiling (B_max in VND)
                  </label>
                  <span className="text-sm font-bold text-teal-700">
                    {budgetMaxVnd.toLocaleString("vi-VN")} VND
                  </span>
                </div>
                <input
                  type="range"
                  min={1_000_000}
                  max={40_000_000}
                  step={250_000}
                  value={budgetMaxVnd}
                  onChange={(e) => setBudgetMaxVnd(Number(e.target.value))}
                  className="mt-2 w-full accent-teal-600"
                />
                <input
                  type="number"
                  value={budgetMaxVnd}
                  onChange={(e) => setBudgetMaxVnd(Number(e.target.value))}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              {/* Live Module A Feasibility Check */}
              {feasibility && (
                <div
                  className={`rounded-2xl p-4 text-xs border ${
                    feasibility.feasible
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-rose-50 border-rose-200 text-rose-900"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {feasibility.feasible ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Feasibility Passed ({feasibility.durationDays} days • Min floor{" "}
                        {feasibility.minRecommendedBudgetVnd.toLocaleString("vi-VN")} VND)
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 text-rose-600" />
                        Anomaly / Feasibility Alert
                      </>
                    )}
                  </div>
                  {feasibility.errors.map((err, i) => (
                    <p key={i} className="mt-1">• {err}</p>
                  ))}
                  {feasibility.warnings.map((w, i) => (
                    <p key={i} className="mt-1 text-amber-800">⚠ {w}</p>
                  ))}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={!feasibility?.feasible}
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  Next: Vibes & Preferences <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  2. Desired Vibes (Jaccard Similarity Tags)
                </label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {VIBE_OPTIONS.map((v) => {
                    const active = vibes.includes(v);
                    return (
                      <button
                        type="button"
                        key={v}
                        onClick={() => toggleVibe(v)}
                        className={`rounded-full px-4 py-2 text-xs font-semibold capitalize transition ${
                          active
                            ? "bg-teal-600 text-white shadow-sm"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        #{v}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Specific Requirements
                </label>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {[
                    { key: "wheelchairAccessible", label: "Wheelchair Accessible" },
                    { key: "vegetarian", label: "Vegetarian Dining" },
                    { key: "noEarlyMornings", label: "No Early Mornings (09:30+)" },
                  ].map((req) => (
                    <label
                      key={req.key}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={requirements[req.key as keyof typeof requirements]}
                        onChange={(e) =>
                          setRequirements((prev) => ({ ...prev, [req.key]: e.target.checked }))
                        }
                        className="h-4 w-4 accent-teal-600"
                      />
                      {req.label}
                    </label>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={isPublicCommunity}
                  onChange={(e) => setIsPublicCommunity(e.target.checked)}
                  className="h-4 w-4 accent-teal-600"
                />
                Share anonymously to Community-Recommended Plans once reviewed
              </label>

              {submitError && (
                <div className="rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700">
                  {submitError}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:opacity-95 disabled:opacity-60"
                >
                  <Sparkles className="h-4 w-4" />
                  {submitting ? "Running CT Algorithms..." : "Generate Smart Itinerary"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      <CommunityPlansSection />
    </div>
  );
}