import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { submitReviewAndUpdateLoop } from "@/lib/modules/moduleF-feedback";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tripId, poiId, rating, comment, aspectLabel } = await req.json();
  const numericRating = Number(rating);
  if (!tripId || !Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    return NextResponse.json({ error: "Valid tripId and rating (1-5) required." }, { status: 400 });
  }
  const trip = await prisma.trip.findUnique({
    where: { id: String(tripId) },
    select: { userId: true, itineraryItems: { select: { poiId: true } } },
  });
  if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  if (trip.userId !== user.userId) {
    return NextResponse.json({ error: "You can only review your own trips." }, { status: 403 });
  }
  if (poiId && !trip.itineraryItems.some((item) => item.poiId === poiId)) {
    return NextResponse.json({ error: "POI is not part of this trip." }, { status: 400 });
  }

  const review = await submitReviewAndUpdateLoop({
    tripId,
    userId: user.userId,
    poiId: poiId || null,
    rating: numericRating,
    comment: String(comment || "").trim(),
    aspectLabel: aspectLabel || "OVERALL",
  });

  return NextResponse.json({ review });
}