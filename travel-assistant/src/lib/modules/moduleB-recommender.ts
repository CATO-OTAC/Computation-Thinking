import { POIRecord, ScoredPOI, TripRequirements } from "@/types/travel";

/**
 * Exact Jaccard Similarity: J(U, D) = |U ∩ D| / |U ∪ D|
 * Prevents POIs with inflated tag lists from unfairly dominating because union grows too.
 */
export function computeJaccardSimilarity(userTags: string[], poiTags: string[]): {
  score: number;
  matchedTags: string[];
} {
  const uSet = new Set(userTags.map((t) => t.toLowerCase()));
  const dSet = new Set(poiTags.map((t) => t.toLowerCase()));

  if (uSet.size === 0 && dSet.size === 0) {
    return { score: 0.5, matchedTags: [] };
  }
  if (uSet.size === 0) {
    // Baseline neutral score when user specifies no vibes
    return { score: 0.4, matchedTags: [] };
  }

  const matchedTags: string[] = [];
  uSet.forEach((tag) => {
    if (dSet.has(tag)) matchedTags.push(tag);
  });

  const unionSet = new Set([...uSet, ...dSet]);
  const score = unionSet.size === 0 ? 0 : matchedTags.length / unionSet.size;
  return { score: Number(score.toFixed(4)), matchedTags };
}

/**
 * Bayesian-smoothed historical feedback adjustment so 1-2 reviews don't skew rankings,
 * while genuine community satisfaction nudges higher-rated spots upward.
 */
export function computeRatingBoost(avgRating: number, reviewCount: number): number {
  const priorMean = 4.4;
  const priorWeight = 10;
  const smoothedRating = (avgRating * reviewCount + priorMean * priorWeight) / (reviewCount + priorWeight);
  // Normalize 1..5 -> 0..1
  return Number(((smoothedRating - 1) / 4).toFixed(4));
}

export function rankPOIsWithJaccard(
  pois: POIRecord[],
  userVibes: string[],
  requirements: TripRequirements
): ScoredPOI[] {
  const eligible = pois.filter((poi) => {
    if (requirements.wheelchairAccessible && !poi.wheelchairAccessible) {
      // Allow lodging/dining only if accessible; strictly filter inaccessible sightseeing
      if (poi.category !== "LODGING") return false;
    }
    if (requirements.vegetarian && poi.category === "DINING" && !poi.vegetarianFriendly) {
      return false;
    }
    return true;
  });

  const scored: ScoredPOI[] = eligible.map((poi) => {
    const { score: jaccardScore, matchedTags } = computeJaccardSimilarity(userVibes, poi.tags);
    const ratingBoost = computeRatingBoost(poi.avgRating, poi.reviewCount);
    // 80% Jaccard similarity + 20% smoothed community feedback rating
    const finalScore = Number((0.8 * jaccardScore + 0.2 * ratingBoost).toFixed(4));

    const matchReason =
      matchedTags.length > 0
        ? `Matched vibes: ${matchedTags.join(", ")} (J=${jaccardScore.toFixed(2)}) • ${poi.avgRating.toFixed(1)}★`
        : `General discovery pick (J=${jaccardScore.toFixed(2)}) • ${poi.avgRating.toFixed(1)}★`;

    return {
      poi,
      jaccardScore,
      ratingBoost,
      finalScore,
      matchedTags,
      matchReason,
    };
  });

  return scored.sort((a, b) => b.finalScore - a.finalScore);
}