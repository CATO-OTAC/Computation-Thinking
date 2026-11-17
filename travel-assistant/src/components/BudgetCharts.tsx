"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

export interface MapStop {
  id: string;
  dayNumber: number;
  orderIndex: number;
  title: string;
  lat: number;
  lng: number;
  startTime: string;
  endTime: string;
  itemType: string;
}

const DAY_COLORS = ["#0d9488", "#2563eb", "#9333ea", "#ea580c", "#e11d48", "#059669"];

export default function ItineraryMap({
  stops = [],
  selectedDay,
}: {
  stops: MapStop[];
  selectedDay: number | "ALL";
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const filtered =
      selectedDay === "ALL" ? stops : stops.filter((s) => s.dayNumber === selectedDay);
    const validStops = filtered.filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng));

    const center: [number, number] =
      validStops.length > 0 ? [validStops[0].lat, validStops[0].lng] : [12.08, 108.82];

    const map = L.map(containerRef.current).setView(center, 12);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const byDay = new Map<number, MapStop[]>();
    for (const s of validStops) {
      const list = byDay.get(s.dayNumber) || [];
      list.push(s);
      byDay.set(s.dayNumber, list);
    }

    const bounds: [number, number][] = [];

    byDay.forEach((dayStops, day) => {
      const color = DAY_COLORS[(day - 1) % DAY_COLORS.length];
      const coords: [number, number][] = [];

      dayStops.forEach((stop, idx) => {
        coords.push([stop.lat, stop.lng]);
        bounds.push([stop.lat, stop.lng]);

        const icon = L.divIcon({
          className: "custom-numbered-pin",
          html: `<div style="background:${color};color:#fff;width:26px;height:26px;border-radius:9999px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35);">${
            idx + 1
          }</div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });

        L.marker([stop.lat, stop.lng], { icon })
          .addTo(map)
          .bindPopup(
            `<strong>Day ${stop.dayNumber} • #${idx + 1}</strong><br/>${stop.title}<br/><small>${stop.startTime} - ${stop.endTime}</small>`
          );
      });

      if (coords.length > 1) {
        L.polyline(coords, { color, weight: 3.5, opacity: 0.85, dashArray: "6 4" }).addTo(map);
      }
    });

    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [35, 35] });
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [stops, selectedDay]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      <div ref={containerRef} className="h-[380px] w-full z-10" />
      <div className="flex flex-wrap items-center gap-3 bg-white px-4 py-2 text-xs text-slate-600 border-t border-slate-100">
        <span className="font-semibold text-slate-800">Spatial Cluster Legend:</span>
        {Array.from(new Set(stops.map((s) => s.dayNumber))).map((d) => (
          <span key={d} className="inline-flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: DAY_COLORS[(d - 1) % DAY_COLORS.length] }}
            />
            Day {d}
          </span>
        ))}
      </div>
    </div>
  );
}