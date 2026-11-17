import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "MANAGER") {
    return NextResponse.json({ error: "Manager access required" }, { status: 403 });
  }

  const [trips, pois, reviews, logs] = await Promise.all([
    prisma.trip.findMany({ include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.pOI.findMany({ orderBy: { avgRating: "desc" } }),
    prisma.review.findMany({
      include: { user: { select: { name: true } }, poi: { select: { name: true } }, trip: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.recommendationLog.findMany({
      include: { user: { select: { name: true } }, trip: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const totalTrips = trips.length;
  const avgBudget = totalTrips ? Math.round(trips.reduce((s, t) => s + t.budgetMaxVnd, 0) / totalTrips) : 0;
  const avgGroupSize = totalTrips ? Number((trips.reduce((s, t) => s + t.groupSize, 0) / totalTrips).toFixed(1)) : 0;
  const avgSatisfaction = reviews.length
    ? Number((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(2))
    : 4.8;

  const destinationCounts: Record<string, number> = { DA_LAT: 0, NHA_TRANG: 0, BOTH: 0 };
  const vibeCounts: Record<string, number> = {};
  for (const t of trips) {
    destinationCounts[t.destinationMode] = (destinationCounts[t.destinationMode] || 0) + 1;
    const vibes: string[] = JSON.parse(t.selectedVibes || "[]");
    for (const v of vibes) vibeCounts[v] = (vibeCounts[v] || 0) + 1;
  }

  const sentimentCounts = {
    POSITIVE: reviews.filter((r) => r.sentiment === "POSITIVE").length,
    NEUTRAL: reviews.filter((r) => r.sentiment === "NEUTRAL").length,
    NEGATIVE: reviews.filter((r) => r.sentiment === "NEGATIVE").length,
  };

  return NextResponse.json({
    kpis: { totalTrips, totalPois: pois.length, avgBudget, avgGroupSize, avgSatisfaction, totalReviews: reviews.length },
    destinationChart: Object.entries(destinationCounts).map(([name, count]) => ({ name, count })),
    vibesChart: Object.entries(vibeCounts)
      .map(([vibe, count]) => ({ vibe, count }))
      .sort((a, b) => b.count - a.count),
    sentimentChart: Object.entries(sentimentCounts).map(([sentiment, count]) => ({ sentiment, count })),
    trips,
    reviews,
    logs,
  });
}