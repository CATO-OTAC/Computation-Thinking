import { prisma } from "@/lib/db/prisma";
import { POIRepository } from "@/lib/db/repositories";
import { CityCode, TripInputPayload } from "@/types/travel";
import { parseAndValidateTripInput } from "./moduleA-parser";
import { rankPOIsWithJaccard } from "./moduleB-recommender";
import { allocateBudgetHardCeiling, finalizeBudgetBreakdown } from "./moduleC-budget";
import { generateSpatialTSPTWItinerary } from "./moduleD-scheduler";
import { generateContextualAdvisory } from "./moduleE-advisory";

export async function generateAndPersistTrip(
  userId: string,
  rawInput: Partial<TripInputPayload>,
  existingTripId?: string
) {
  const startMs = Date.now();

  // Module A: Parse & Feasibility Check
  const feasibility = parseAndValidateTripInput(rawInput);
  if (!feasibility.valid || !feasibility.feasible) {
    return { ok: false as const, feasibility };
  }

  const input = feasibility.parsedInput;
  const cities: CityCode[] =
    input.destinationMode === "BOTH" ? ["DA_LAT", "NHA_TRANG"] : [input.destinationMode];

  // Tier 3: Fetch candidate POIs
  const candidatePois = await POIRepository.findByCities(cities);

  // Module B: Jaccard Similarity + Rating-Adjusted Ranking
  const scoredPois = rankPOIsWithJaccard(candidatePois, input.vibes, input.requirements);

  // Module C: Pre-allocate Hard Ceiling B_max
  const budgetCaps = allocateBudgetHardCeiling(
    input.budgetMaxVnd,
    feasibility.durationDays,
    input.groupSize,
    input.destinationMode
  );

  // Module D: Spatial Clustering + Greedy TSPTW
  const schedule = generateSpatialTSPTWItinerary({
    scoredPois,
    destinationMode: input.destinationMode,
    durationDays: feasibility.durationDays,
    groupSize: input.groupSize,
    requirements: input.requirements,
    budgetCaps,
  });

  // Module C Finalize: Compute exact category & daily projections <= B_max
  const finalizedBudget = finalizeBudgetBreakdown(
    budgetCaps,
    schedule.items,
    feasibility.durationDays
  );

  // Module E: Weather, Risks, Packing & Indoor Backup summary
  const advisory = generateContextualAdvisory(
    input.destinationMode,
    input.startDate,
    schedule.items
  );

  const topJaccardMatches = scoredPois
    .filter((s) => s.poi.category !== "LODGING" && s.poi.category !== "DINING")
    .slice(0, 5)
    .map((s) => ({
      id: s.poi.id,
      name: s.poi.name,
      city: s.poi.city,
      jaccardScore: s.jaccardScore,
      finalScore: s.finalScore,
      matchedTags: s.matchedTags,
    }));

  const algorithmInsights = {
    distanceSavedKm: schedule.distanceSavedKm,
    clusterEfficiencyPct: schedule.clusterEfficiencyPct,
    budgetCeilingMet: finalizedBudget.withinCeiling,
    projectedTotalVnd: finalizedBudget.projectedTotalVnd,
    budgetMaxVnd: input.budgetMaxVnd,
    topJaccardMatches,
    warnings: feasibility.warnings,
  };

  const executionTimeMs = Date.now() - startMs;

  // Persist atomically (supports live re-balancing if existingTripId is provided)
  if (existingTripId) {
    await prisma.itineraryItem.deleteMany({ where: { tripId: existingTripId } });
    await prisma.budgetBreakdown.deleteMany({ where: { tripId: existingTripId } });
  }

  const tripData = {
    userId,
    title: input.title!,
    destinationMode: input.destinationMode,
    startDate: input.startDate,
    endDate: input.endDate,
    durationDays: feasibility.durationDays,
    groupSize: input.groupSize,
    budgetMaxVnd: input.budgetMaxVnd,
    projectedTotalVnd: finalizedBudget.projectedTotalVnd,
    selectedVibes: JSON.stringify(input.vibes),
    requirements: JSON.stringify(input.requirements),
    isPublicCommunity: Boolean(input.isPublicCommunity),
    algorithmInsightsJson: JSON.stringify(algorithmInsights),
    advisoryJson: JSON.stringify(advisory),
  };

  const trip = existingTripId
    ? await prisma.trip.update({ where: { id: existingTripId }, data: tripData })
    : await prisma.trip.create({ data: tripData });

  for (const item of schedule.items) {
    await prisma.itineraryItem.create({
      data: {
        tripId: trip.id,
        dayNumber: item.dayNumber,
        city: item.city,
        clusterId: item.clusterId,
        poiId: item.poiId,
        itemType: item.itemType,
        title: item.title,
        startTime: item.startTime,
        endTime: item.endTime,
        travelTimeMins: item.travelTimeMins,
        distanceKm: item.distanceKm,
        estimatedCostVnd: item.estimatedCostVnd,
        jaccardScore: item.jaccardScore,
        matchReason: item.matchReason,
        orderIndex: item.orderIndex,
        isBackupIndoor: item.isBackupIndoor,
        backupPoiId: item.backupPoiId ?? null,
        backupTitle: item.backupTitle ?? null,
        backupStartTime: item.backupStartTime ?? null,
        backupEndTime: item.backupEndTime ?? null,
        backupCostVnd: item.backupCostVnd ?? null,
      },
    });
  }

  for (const b of finalizedBudget.breakdowns) {
    await prisma.budgetBreakdown.create({
      data: {
        tripId: trip.id,
        category: b.category,
        allocatedVnd: b.allocatedVnd,
        projectedVnd: b.projectedVnd,
        dailyBreakdownJson: JSON.stringify(b.dailyBreakdown),
      },
    });
  }

  await prisma.recommendationLog.create({
    data: {
      tripId: trip.id,
      userId,
      destinationMode: input.destinationMode,
      budgetMaxVnd: input.budgetMaxVnd,
      projectedTotalVnd: finalizedBudget.projectedTotalVnd,
      topJaccardJson: JSON.stringify(topJaccardMatches.slice(0, 3)),
      distanceSavedKm: schedule.distanceSavedKm,
      executionTimeMs,
    },
  });

  return { ok: true as const, tripId: trip.id, feasibility, algorithmInsights };
}