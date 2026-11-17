"use client";

import { useState } from "react";
import { Star, X } from "lucide-react";

export default function ReviewModal({
  tripId,
  pois,
  onClose,
  onSubmitted,
}: {
  tripId: string;
  pois: { id: string; name: string }[];
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [poiId, setPoiId] = useState<string>("");
  const [aspectLabel, setAspectLabel] = useState("OVERALL");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripId, poiId: poiId || null, rating, comment, aspectLabel }),
    });
    setSaving(false);
    if (res.ok) {
      onSubmitted();
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Post-Trip Rating & Feedback</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700">Target (Overall Trip or Specific Place)</label>
            <select
              value={poiId}
              onChange={(e) => {
                setPoiId(e.target.value);
                setAspectLabel(e.target.value ? "POI" : "OVERALL");
              }}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Overall Trip Itinerary</option>
              {pois.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">Star Rating</label>
            <div className="mt-1 flex gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setRating(s)}
                  className="p-1"
                >
                  <Star
                    className={`h-7 w-7 ${
                      s <= rating ? "fill-amber-400 text-amber-500" : "text-slate-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">Your Feedback</label>
            <textarea
              rows={3}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How accurate were the recommendations, routing, and budget?"
              className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
          >
            {saving ? "Submitting..." : "Submit Review (Updates Recommendation Loop)"}
          </button>
        </form>
      </div>
    </div>
  );
}