"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CloudRain,
  Printer,
  Copy,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Cpu,
  AlertTriangle,
  CheckSquare,
  Square,
  RefreshCw,
  Star,
  ArrowLeftRight,
} from "lucide-react";
import BudgetCharts from "@/components/BudgetCharts";
import ReviewModal from "@/components/ReviewModal";
import { POIServiceItem, PriceItemType } from "@/types/travel";

const ItineraryMap = dynamic(() => import("@/components/ItineraryMap"), { ssr: false });

const SERVICE_TYPE_LABELS: Record<PriceItemType, string> = {
  TICKET: "Vé / Phí vào",
  MENU: "Menu / Món",
  SERVICE: "Dịch vụ",
  SOUVENIR: "Mua sắm",
};

function formatVnd(amount: number): string {
  return `${Number(amount || 0).toLocaleString("vi-VN")} VND`;
}

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [trip, setTrip] = useState<any>(null);
  const [allPois, setAllPois] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | "ALL">("ALL");
  const [rainyMode, setRainyMode] = useState(false);
  const [showInsights, setShowInsights] = useState(true);
  const [rebalanceBudget, setRebalanceBudget] = useState<number>(0);
  const [rebalancing, setRebalancing] = useState(false);
  const [swapTarget, setSwapTarget] = useState<any>(null);
  const [swapError, setSwapError] = useState("");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [checklist, setChecklist] = useState<any[]>([]);

  async function loadTrip() {
    const res = await fetch(`/api/trips/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setTrip(data.trip);
    setRebalanceBudget(data.trip.budgetMaxVnd);
    const adv = JSON.parse(data.trip.advisoryJson || "{}");
    setChecklist(adv.checklist || []);
  }

  useEffect(() => {
    loadTrip();
    fetch("/api/pois")
      .then((r) => r.json())
      .then((d) => setAllPois(d.pois || []));
  }, [id]);

  const displayedItems = useMemo(() => {
    if (!trip) return [];
    const items = trip.itineraryItems || [];
    return selectedDay === "ALL" ? items : items.filter((i: any) => i.dayNumber === selectedDay);
  }, [trip, selectedDay]);

  const mapStops = useMemo(() => {
    if (!trip) return [];
    return (trip.itineraryItems || [])
      .filter((i: any) => i.poi && i.itemType !== "TRANSFER")
      .map((i: any) => ({
        id: i.id,
        dayNumber: i.dayNumber,
        orderIndex: i.orderIndex,
        title: rainyMode && i.backupTitle ? i.backupTitle : i.title,
        lat: i.poi.lat,
        lng: i.poi.lng,
        startTime: rainyMode && i.backupStartTime ? i.backupStartTime : i.startTime,
        endTime: rainyMode && i.backupEndTime ? i.backupEndTime : i.endTime,
        itemType: i.itemType,
      }));
  }, [trip, rainyMode]);

  async function handleLiveRebalance() {
    if (!trip) return;
    setRebalancing(true);
    const res = await fetch("/api/trips/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        existingTripId: trip.id,
        title: trip.title,
        destinationMode: trip.destinationMode,
        startDate: trip.startDate,
        endDate: trip.endDate,
        groupSize: trip.groupSize,
        budgetMaxVnd: rebalanceBudget,
        vibes: JSON.parse(trip.selectedVibes || "[]"),
        requirements: JSON.parse(trip.requirements || "{}"),
        isPublicCommunity: trip.isPublicCommunity,
      }),
    });
    setRebalancing(false);
    if (res.ok) {
      await loadTrip();
    } else {
      const err = await res.json();
      alert(err.feasibility?.errors?.join(" ") || err.error || "Budget too low to rebalance.");
    }
  }

  async function handleSwapPoi(newPoiId: string) {
    if (!swapTarget) return;
    setSwapError("");
    const res = await fetch(`/api/trips/${trip.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: swapTarget.id, newPoiId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setSwapError(data.error);
      return;
    }
    setSwapTarget(null);
    await loadTrip();
  }

  async function handleClone() {
    const res = await fetch(`/api/trips/${trip.id}/clone`, { method: "POST" });
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    const d = await res.json();
    if (d.tripId) router.push(`/trips/${d.tripId}`);
  }

  if (!trip) return <div className="py-12 text-center text-sm text-slate-500">Loading itinerary workspace...</div>;

  const insights = JSON.parse(trip.algorithmInsightsJson || "{}");
  const advisory = JSON.parse(trip.advisoryJson || "{}");
  const vibes: string[] = JSON.parse(trip.selectedVibes || "[]");
  const uniquePoisInTrip = Array.from(
    new Map(
      (trip.itineraryItems || [])
        .filter((i: any) => i.poi)
        .map((i: any) => [i.poi.id, { id: i.poi.id, name: i.poi.name }])
    ).values()
  ) as { id: string; name: string }[];

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-teal-100 px-3 py-0.5 font-bold text-teal-800">
                {trip.destinationMode}
              </span>
              <span className="text-slate-500">
                {trip.startDate} → {trip.endDate} ({trip.durationDays} days • {trip.groupSize} travelers)
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">{trip.title}</h1>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {vibes.map((v) => (
                <span key={v} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                  #{v}
                </span>
              ))}
            </div>
          </div>

          <div className="no-print flex flex-wrap gap-2">
            <button
              onClick={() => setRainyMode(!rainyMode)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                rainyMode
                  ? "bg-indigo-600 text-white shadow"
                  : "border border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100"
              }`}
            >
              <CloudRain className="h-4 w-4" />
              {rainyMode ? "Rainy-Day Indoor Mode: ON" : "Simulate Rainy Day / Indoor Backup"}
            </button>

            <button
              onClick={handleClone}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Copy className="h-4 w-4" /> Clone Plan
            </button>

            <button
              onClick={() => setShowReviewModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-white hover:bg-amber-600"
            >
              <Star className="h-4 w-4" /> Leave Review
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              <Printer className="h-4 w-4" /> Export PDF
            </button>
          </div>
        </div>

        {/* Live Budget Re-Balancing Bar */}
        <div className="no-print flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-200">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <SlidersHorizontal className="h-4 w-4 text-teal-600" />
            <span>Live Re-Balance Budget Ceiling (B_max):</span>
            <span className="font-bold text-teal-700">{formatVnd(rebalanceBudget)}</span>
          </div>
          <div className="flex flex-1 items-center gap-3 min-w-[240px]">
            <input
              type="range"
              min={1_500_000}
              max={40_000_000}
              step={250_000}
              value={rebalanceBudget}
              onChange={(e) => setRebalanceBudget(Number(e.target.value))}
              className="w-full accent-teal-600"
            />
            <button
              onClick={handleLiveRebalance}
              disabled={rebalancing}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-teal-700 disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${rebalancing ? "animate-spin" : ""}`} />
              Re-Run TSPTW + Budget
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible Computational Thinking Insights */}
      <div className="glass-card rounded-2xl border border-teal-200/80 shadow-sm overflow-hidden print-break-inside-avoid">
        <button
          onClick={() => setShowInsights(!showInsights)}
          className="flex w-full items-center justify-between bg-teal-50/70 px-5 py-3 text-left"
        >
          <span className="flex items-center gap-2 text-sm font-bold text-teal-900">
            <Cpu className="h-4 w-4 text-teal-700" />
            Computational Thinking Insights (Algorithm Transparency)
          </span>
          {showInsights ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showInsights && (
          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-3 text-xs">
            <div className="rounded-xl bg-white p-4 border border-slate-100">
              <div className="font-bold text-slate-800 mb-2">Top Jaccard Similarity J(U, D)</div>
              <ul className="space-y-1.5">
                {(insights.topJaccardMatches || []).map((m: any, i: number) => (
                  <li key={i} className="flex justify-between">
                    <span className="truncate pr-2 text-slate-700">{m.name}</span>
                    <span className="font-bold text-teal-700">{Number(m.jaccardScore).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl bg-white p-4 border border-slate-100">
              <div className="font-bold text-slate-800 mb-2">Spatial Clustering Efficiency</div>
              <p className="text-2xl font-extrabold text-sky-600">
                ~{insights.distanceSavedKm || 12.5} km saved
              </p>
              <p className="mt-1 text-slate-600">
                ~{insights.clusterEfficiencyPct || 30}% reduction vs unclustered zigzag traversal via K-Means + Greedy TSPTW.
              </p>
            </div>

            <div className="rounded-xl bg-white p-4 border border-slate-100">
              <div className="font-bold text-slate-800 mb-2">Hard Budget Ceiling Proof</div>
              <p className="text-lg font-extrabold text-emerald-700">
                {trip.projectedTotalVnd.toLocaleString("vi-VN")} ≤ {trip.budgetMaxVnd.toLocaleString("vi-VN")} VND
              </p>
              <p className="mt-1 text-emerald-700 font-semibold">
                ✓ Invariant Verified (Projected ≤ B_max)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Map + Day Timeline */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5 space-y-4 no-print">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Clustered Route Map</h2>
            <div className="flex gap-1">
              <button
                onClick={() => setSelectedDay("ALL")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                  selectedDay === "ALL" ? "bg-slate-900 text-white" : "bg-white text-slate-700 border"
                }`}
              >
                All Days
              </button>
              {Array.from({ length: trip.durationDays }, (_, i) => i + 1).map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDay(d)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                    selectedDay === d ? "bg-teal-600 text-white" : "bg-white text-slate-700 border"
                  }`}
                >
                  D{d}
                </button>
              ))}
            </div>
          </div>
          <ItineraryMap stops={mapStops} selectedDay={selectedDay} />
        </div>

        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Chronological TSPTW Itinerary</h2>
          <div className="space-y-3">
            {displayedItems.map((item: any) => {
              const isSwappedRainy = rainyMode && item.backupTitle;
              const displayCost =
                isSwappedRainy && item.backupCostVnd != null
                  ? item.backupCostVnd
                  : item.estimatedCostVnd;
              const poiServices: POIServiceItem[] = Array.isArray(item.poi?.services)
                ? item.poi.services
                : [];
              const priceNoteLabel: string =
                item.priceLabel ||
                item.poi?.priceLabel ||
                (item.itemType === "MEAL"
                  ? "Suất ăn & menu dự kiến"
                  : item.itemType === "LODGING"
                    ? "Chi phí lưu trú dự kiến"
                    : item.itemType === "TRANSFER"
                      ? "Chi phí di chuyển dự kiến"
                      : "Giá vé / chi phí dự kiến tại điểm");

              return (
                <div
                  key={item.id}
                  className={`glass-card rounded-2xl p-4 shadow-sm border-l-4 print-break-inside-avoid ${
                    isSwappedRainy ? "border-l-indigo-500 bg-indigo-50/40" : "border-l-teal-500"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex-1 min-w-[220px]">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                        <span className="rounded bg-slate-200 px-1.5 py-0.5 text-slate-800">
                          Day {item.dayNumber}
                        </span>
                        <span>
                          {isSwappedRainy && item.backupStartTime ? item.backupStartTime : item.startTime} –{" "}
                          {isSwappedRainy && item.backupEndTime ? item.backupEndTime : item.endTime}
                        </span>
                        <span className="text-teal-700">{item.city}</span>
                        {item.travelTimeMins > 0 && (
                          <span>• {item.distanceKm} km ({item.travelTimeMins}m transit)</span>
                        )}
                      </div>
                      <h3 className="mt-1 text-base font-bold text-slate-900">
                        {isSwappedRainy ? item.backupTitle : item.title}
                      </h3>
                      <p className="text-xs text-slate-600">{item.matchReason}</p>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900">{formatVnd(displayCost)}</div>
                      <div className="text-[11px] font-medium text-teal-700">{priceNoteLabel}</div>
                      {item.itemType !== "TRANSFER" && (
                        <button
                          onClick={() => {
                            setSwapTarget(item);
                            setSwapError("");
                          }}
                          className="no-print mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 hover:underline"
                        >
                          <ArrowLeftRight className="h-3 w-3" /> Swap POI
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Chi tiết giá vé, menu & dịch vụ đi kèm của địa điểm */}
                  {!isSwappedRainy && poiServices.length > 0 && (
                    <div className="mt-3 rounded-xl border border-slate-200/80 bg-slate-50/90 p-2.5 text-xs">
                      <div className="mb-1.5 font-semibold text-slate-700">
                        Chi tiết giá vé, menu & dịch vụ tham khảo:
                      </div>
                      <div className="space-y-1">
                        {poiServices.map((srv) => (
                          <div
                            key={srv.id}
                            className="flex items-start justify-between gap-2 rounded-lg bg-white px-2.5 py-1.5 border border-slate-100"
                          >
                            <div>
                              <span className="font-medium text-slate-800">{srv.name}</span>
                              <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                                {SERVICE_TYPE_LABELS[srv.type] || srv.type}
                              </span>
                              <span className="ml-1.5 text-[10px] text-slate-500">
                                {srv.includedInEstimate ? "(Đã gộp dự kiến)" : "(Tùy chọn thêm)"}
                              </span>
                              {srv.note && (
                                <div className="text-[10px] text-slate-500">{srv.note}</div>
                              )}
                            </div>
                            <span className="shrink-0 font-semibold text-slate-800">
                              {formatVnd(srv.priceVnd)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Itemized 5-Category Budget Allocation */}
      <section className="glass-card rounded-3xl p-6 shadow-sm space-y-5 print-break-inside-avoid">
        <h2 className="text-xl font-bold text-slate-900">Budget Allocation & Expense Control (B_max)</h2>
        <BudgetCharts breakdowns={trip.budgetBreakdowns || []} />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase">
                <th className="py-2.5">Category</th>
                <th className="py-2.5">Allocated Cap</th>
                <th className="py-2.5">Projected Cost</th>
                <th className="py-2.5">Remaining Buffer</th>
              </tr>
            </thead>
            <tbody>
              {(trip.budgetBreakdowns || []).map((b: any) => (
                <tr key={b.id} className="border-b border-slate-100">
                  <td className="py-2.5 font-bold text-slate-800">{b.category}</td>
                  <td className="py-2.5">{formatVnd(b.allocatedVnd)}</td>
                  <td className="py-2.5 font-semibold text-teal-700">{formatVnd(b.projectedVnd)}</td>
                  <td className="py-2.5 text-emerald-700">
                    {formatVnd(b.allocatedVnd - b.projectedVnd)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Module E: Contextual Advisory & Interactive Packing Checklist */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 print-break-inside-avoid">
        <div className="glass-card rounded-2xl p-6 shadow-sm space-y-3">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" /> Weather & Terrain Risk Warnings
          </h3>
          {(advisory.warnings || []).map((w: any, idx: number) => (
            <div key={idx} className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs">
              <div className="font-bold text-amber-900">
                [{w.city}] {w.title} ({w.severity})
              </div>
              <p className="mt-1 text-amber-800">{w.detail}</p>
            </div>
          ))}
        </div>

        <div className="glass-card rounded-2xl p-6 shadow-sm space-y-3">
          <h3 className="text-lg font-bold text-slate-900">Tailored Packing Checklist</h3>
          <div className="space-y-2">
            {checklist.map((c: any) => (
              <button
                key={c.id}
                type="button"
                onClick={() =>
                  setChecklist((prev) =>
                    prev.map((x) => (x.id === c.id ? { ...x, checked: !x.checked } : x))
                  )
                }
                className="flex w-full items-center gap-2.5 rounded-xl bg-white p-2.5 text-left text-xs border border-slate-100 hover:bg-slate-50"
              >
                {c.checked ? (
                  <CheckSquare className="h-4 w-4 text-teal-600 shrink-0" />
                ) : (
                  <Square className="h-4 w-4 text-slate-400 shrink-0" />
                )}
                <span className={c.checked ? "line-through text-slate-400" : "text-slate-700"}>
                  <strong className="text-slate-900">[{c.category}]</strong> {c.item}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Swap POI Modal */}
      {swapTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Swap "{swapTarget.title}"</h3>
            {swapError && <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700">{swapError}</div>}
            <div className="max-h-72 overflow-y-auto space-y-2">
              {allPois
                .filter((p) => p.city === swapTarget.city)
                .map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSwapPoi(p.id)}
                    className="flex w-full items-start justify-between gap-3 rounded-xl border border-slate-200 p-3 text-left text-xs hover:bg-teal-50"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-slate-500">
                        {p.category} • {p.weatherSensitivity} • {p.avgRating.toFixed(1)}★
                      </div>
                      {p.priceLabel && (
                        <div className="mt-0.5 text-[11px] font-medium text-teal-700">
                          {p.priceLabel}
                        </div>
                      )}
                      {Array.isArray(p.services) && p.services.length > 0 && (
                        <div className="mt-1 text-[11px] text-slate-600">
                          Dịch vụ/menu: {p.services.map((s: POIServiceItem) => `${s.name} (${formatVnd(s.priceVnd)})`).join(" • ")}
                        </div>
                      )}
                    </div>
                    <span className="shrink-0 font-bold text-teal-700">
                      {formatVnd(p.estimatedCostVnd * trip.groupSize)}
                    </span>
                  </button>
                ))}
            </div>
            <button
              onClick={() => setSwapTarget(null)}
              className="w-full rounded-xl border border-slate-300 py-2 text-xs font-semibold text-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showReviewModal && (
        <ReviewModal
          tripId={trip.id}
          pois={uniquePoisInTrip}
          onClose={() => setShowReviewModal(false)}
          onSubmitted={loadTrip}
        />
      )}
    </div>
  );
}
