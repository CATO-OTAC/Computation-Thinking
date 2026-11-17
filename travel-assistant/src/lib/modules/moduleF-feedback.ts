import { prisma } from "@/lib/db/prisma";

const POSITIVE_WORDS = ["great", "love", "amazing", "best", "clean", "friendly", "smooth", "perfect", "efficient", "delicious"];
const NEGATIVE_WORDS = ["bad", "slow", "dirty", "expensive", "crowded", "rainy", "far", "late", "disappointing", "poor"];

export function analyzeSentiment(comment: string, rating: number): "POSITIVE" | "NEUTRAL" | "NEGATIVE" {
  const lower = comment.toLowerCase();
  let score = rating >= 4 ? 1 : rating <= 2 ? -1 : 0;
  for (const w of POSITIVE_WORDS) if (lower.includes(w)) score++;
  for (const w of NEGATIVE_WORDS) if (lower.includes(w)) score--;
  if (score > 0) return "POSITIVE";
  if (score < 0) return "NEGATIVE";
  return "NEUTRAL";
}

export async function submitReviewAndUpdateLoop(params: {
  tripId: string;
  userId: string;
  poiId?: string | null;
  rating: number;
  comment: string;
  aspectLabel: string;
}) {
  const sentiment = analyzeSentiment(params.comment, params.rating);

  const review = await prisma.review.create({
    data: {
      tripId: params.tripId,
      userId: params.userId,
      poiId: params.poiId || null,
      rating: params.rating,
      comment: params.comment,
      aspectLabel: params.aspectLabel,
      sentiment,
    },
  });

  // Dynamically update POI average rating for Module B feedback loop
  if (params.poiId) {
    const poiReviews = await prisma.review.findMany({ where: { poiId: params.poiId } });
    const poi = await prisma.pOI.findUnique({ where: { id: params.poiId } });
    if (poi && poiReviews.length > 0) {
      const avg =
        poiReviews.reduce((s, r) => s + r.rating, 0) / poiReviews.length;
      // Blend seeded baseline with new reviews
      const combinedCount = poi.reviewCount + 1;
      const combinedAvg = Number(
        (((poi.avgRating * poi.reviewCount) + params.rating) / combinedCount).toFixed(2)
      );
      await prisma.pOI.update({
        where: { id: params.poiId },
        data: { avgRating: combinedAvg, reviewCount: combinedCount },
      });
    }
  }

  // Update Trip satisfaction score for Community Showcase
  const tripReviews = await prisma.review.findMany({ where: { tripId: params.tripId } });
  const tripAvg = Number(
    (tripReviews.reduce((s, r) => s + r.rating, 0) / Math.max(1, tripReviews.length)).toFixed(2)
  );
  await prisma.trip.update({
    where: { id: params.tripId },
    data: { avgRating: tripAvg, reviewCount: tripReviews.length, status: "COMPLETED" },
  });

  return review;
}