"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Plus, Trash2, Edit3, ShieldCheck, Activity, MessageSquare, MapPin } from "lucide-react";

export default function ManagerDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [pois, setPois] = useState<any[]>([]);
  const [tab, setTab] = useState<"ANALYTICS" | "POIS" | "FEEDBACK" | "LOGS">("ANALYTICS");
  const [error, setError] = useState("");
  const [editingPoi, setEditingPoi] = useState<any>(null);

  const emptyForm = {
    name: "",
    city: "DA_LAT",
    description: "",
    lat: 11.94,
    lng: 108.44,
    category: "SIGHTSEEING",
    tags: "nature, photography",
    estimatedCostVnd: 100000,
    avgDurationMins: 90,
    openTime: "07:30",
    closeTime: "17:30",
    weatherSensitivity: "OUTDOOR",
    terrainType: "HIGHLAND",
    wheelchairAccessible: true,
    vegetarianFriendly: false,
  };
  const [form, setForm] = useState<any>(emptyForm);

  async function loadAll() {
    const [aRes, pRes] = await Promise.all([fetch("/api/manager/analytics"), fetch("/api/pois")]);
    if (aRes.status === 403) {
      setError("Access Denied: Please log in with a Manager account (manager@demo.com / admin123).");
      return;
    }
    setData(await aRes.json());
    const pJson = await pRes.json();
    setPois(pJson.pois || []);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleSavePoi(e: React.FormEvent) {
    e.preventDefault();
    const url = editingPoi ? `/api/manager/pois/${editingPoi.id}` : "/api/manager/pois";
    const method = editingPoi ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setEditingPoi(null);
      setForm(emptyForm);
      loadAll();
    }
  }

  async function handleDeletePoi(id: string) {
    if (!confirm("Delete this POI from the database?")) return;
    await fetch(`/api/manager/pois/${id}`, { method: "DELETE" });
    loadAll();
  }

  if (error) {
    return <div className="mx-auto max-w-lg rounded-2xl bg-rose-50 p-6 text-center text-sm font-semibold text-rose-700">{error}</div>;
  }
  if (!data) return <div className="py-12 text-center text-sm text-slate-500">Loading Manager Operations Hub...</div>;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-700">
            <ShieldCheck className="h-4 w-4" /> Admin & Operations Control
          </span>
          <h1 className="text-3xl font-bold text-slate-900">Manager Analytics & POI Hub</h1>
        </div>
        <div className="flex gap-2">
          {(["ANALYTICS", "POIS", "FEEDBACK", "LOGS"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                tab === t ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Total Generated Trips", value: data.kpis.totalTrips },
          { label: "Avg Budget Ceiling", value: `${data.kpis.avgBudget.toLocaleString("vi-VN")} VND` },
          { label: "Avg Satisfaction", value: `${data.kpis.avgSatisfaction} ★ (${data.kpis.totalReviews})` },
          { label: "Seeded POIs", value: data.kpis.totalPois },
        ].map((k, i) => (
          <div key={i} className="glass-card rounded-2xl p-4 shadow-sm">
            <div className="text-xs text-slate-500">{k.label}</div>
            <div className="mt-1 text-xl font-extrabold text-slate-900">{k.value}</div>
          </div>
        ))}
      </div>

      {tab === "ANALYTICS" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="glass-card rounded-2xl p-5 h-72">
            <h3 className="mb-3 text-sm font-bold text-slate-800">Popular Destinations</h3>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={data.destinationChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0d9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card rounded-2xl p-5 h-72">
            <h3 className="mb-3 text-sm font-bold text-slate-800">Preferred Traveler Vibes</h3>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={data.vibesChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="vibe" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === "POIS" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <form onSubmit={handleSavePoi} className="glass-card rounded-2xl p-5 space-y-3 lg:col-span-4 h-fit">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-teal-600" />
              {editingPoi ? `Edit: ${editingPoi.name}` : "Add New POI"}
            </h3>
            <input
              required
              placeholder="POI Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border px-3 py-2 text-xs"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="rounded-lg border px-2 py-2 text-xs"
              >
                <option value="DA_LAT">DA_LAT</option>
                <option value="NHA_TRANG">NHA_TRANG</option>
              </select>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="rounded-lg border px-2 py-2 text-xs"
              >
                {["SIGHTSEEING", "DINING", "LODGING", "ADVENTURE", "RELAX"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="0.0001"
                value={form.lat}
                onChange={(e) => setForm({ ...form, lat: e.target.value })}
                placeholder="Lat"
                className="rounded-lg border px-3 py-2 text-xs"
              />
              <input
                type="number"
                step="0.0001"
                value={form.lng}
                onChange={(e) => setForm({ ...form, lng: e.target.value })}
                placeholder="Lng"
                className="rounded-lg border px-3 py-2 text-xs"
              />
            </div>
            <input
              placeholder="Vibe tags (comma separated)"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="w-full rounded-lg border px-3 py-2 text-xs"
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                value={form.estimatedCostVnd}
                onChange={(e) => setForm({ ...form, estimatedCostVnd: e.target.value })}
                placeholder="Cost VND"
                className="rounded-lg border px-2 py-2 text-xs"
              />
              <input
                value={form.openTime}
                onChange={(e) => setForm({ ...form, openTime: e.target.value })}
                placeholder="08:00"
                className="rounded-lg border px-2 py-2 text-xs"
              />
              <input
                value={form.closeTime}
                onChange={(e) => setForm({ ...form, closeTime: e.target.value })}
                placeholder="18:00"
                className="rounded-lg border px-2 py-2 text-xs"
              />
            </div>
            <select
              value={form.weatherSensitivity}
              onChange={(e) => setForm({ ...form, weatherSensitivity: e.target.value })}
              className="w-full rounded-lg border px-2 py-2 text-xs"
            >
              <option value="OUTDOOR">OUTDOOR</option>
              <option value="INDOOR">INDOOR</option>
            </select>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2 text-xs font-bold text-white"
            >
              <Plus className="h-4 w-4" /> {editingPoi ? "Update POI" : "Create POI"}
            </button>
          </form>

          <div className="glass-card rounded-2xl p-5 lg:col-span-8 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b text-slate-500">
                  <th className="py-2">Name</th>
                  <th>City</th>
                  <th>Category</th>
                  <th>Cost (VND)</th>
                  <th>Rating</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pois.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100">
                    <td className="py-2 font-semibold text-slate-900">{p.name}</td>
                    <td>{p.city}</td>
                    <td>{p.category}</td>
                    <td>{p.estimatedCostVnd.toLocaleString("vi-VN")}</td>
                    <td>{p.avgRating.toFixed(1)}★ ({p.reviewCount})</td>
                    <td className="text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingPoi(p);
                          setForm({ ...p, tags: p.tags.join(", ") });
                        }}
                        className="text-indigo-600 hover:underline"
                      >
                        <Edit3 className="inline h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDeletePoi(p.id)} className="text-rose-600 hover:underline">
                        <Trash2 className="inline h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "FEEDBACK" && (
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-teal-600" /> User Feedback & Sentiment Inspector
          </h3>
          <div className="space-y-2">
            {data.reviews.map((r: any) => (
              <div key={r.id} className="rounded-xl bg-white p-3.5 border border-slate-100 text-xs flex justify-between gap-4">
                <div>
                  <span className="font-bold text-slate-900">{r.user.name}</span>{" "}
                  <span className="text-slate-500">on {r.poi?.name || r.trip.title}</span>
                  <p className="mt-1 text-slate-700">{r.comment}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-amber-600">{r.rating} ★</div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      r.sentiment === "POSITIVE"
                        ? "bg-emerald-100 text-emerald-800"
                        : r.sentiment === "NEGATIVE"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {r.sentiment}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "LOGS" && (
        <div className="glass-card rounded-2xl p-5 overflow-x-auto">
          <h3 className="mb-3 font-bold text-slate-900 flex items-center gap-2">
            <Activity className="h-4 w-4 text-indigo-600" /> Recommendation Engine Execution Logs
          </h3>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b text-slate-500">
                <th className="py-2">Trip</th>
                <th>Mode</th>
                <th>Projected / B_max</th>
                <th>Distance Saved</th>
                <th>Exec Time</th>
              </tr>
            </thead>
            <tbody>
              {data.logs.map((l: any) => (
                <tr key={l.id} className="border-b border-slate-100">
                  <td className="py-2 font-semibold">{l.trip?.title}</td>
                  <td>{l.destinationMode}</td>
                  <td className="text-emerald-700 font-semibold">
                    {l.projectedTotalVnd.toLocaleString("vi-VN")} / {l.budgetMaxVnd.toLocaleString("vi-VN")}
                  </td>
                  <td>{l.distanceSavedKm} km</td>
                  <td>{l.executionTimeMs} ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}