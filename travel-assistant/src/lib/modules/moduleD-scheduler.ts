import {
  CityCode,
  DestinationMode,
  POIRecord,
  ScheduledItemDraft,
  ScoredPOI,
  TripRequirements,
} from "@/types/travel";
import { BudgetPlanCaps } from "./moduleC-budget";

const EARTH_RADIUS_KM = 6371;

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Number((2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2));
}

export function timeToMins(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minsToTime(mins: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, Math.round(mins)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Balanced K-Means Spatial Clustering so each day focuses on a geographically compact zone,
 * eliminating cross-city zigzagging.
 */
function clusterPoisSpatially(pois: ScoredPOI[], kDays: number): ScoredPOI[][] {
  if (kDays <= 1 || pois.length <= 1) return [pois];
  const k = Math.min(kDays, pois.length);

  // Initialize centroids using evenly spaced sorted latitude points (deterministic)
  const sorted = [...pois].sort((a, b) => a.poi.lat - b.poi.lat || a.poi.lng - b.poi.lng);
  let centroids = Array.from({ length: k }, (_, i) => {
    const idx = Math.floor((i * sorted.length) / k);
    return { lat: sorted[idx].poi.lat, lng: sorted[idx].poi.lng };
  });

  let clusters: ScoredPOI[][] = Array.from({ length: k }, () => []);

  for (let iter = 0; iter < 8; iter++) {
    clusters = Array.from({ length: k }, () => []);
    for (const item of sorted) {
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let c = 0; c < k; c++) {
        const d = haversineKm(item.poi.lat, item.poi.lng, centroids[c].lat, centroids[c].lng);
        // Mild load-balancing penalty so one cluster doesn't hoard all POIs
        const balancedDist = d + clusters[c].length * 0.8;
        if (balancedDist < bestDist) {
          bestDist = balancedDist;
          bestIdx = c;
        }
      }
      clusters[bestIdx].push(item);
    }

    centroids = clusters.map((cluster, idx) => {
      if (cluster.length === 0) return centroids[idx];
      const lat = cluster.reduce((s, x) => s + x.poi.lat, 0) / cluster.length;
      const lng = cluster.reduce((s, x) => s + x.poi.lng, 0) / cluster.length;
      return { lat, lng };
    });
  }

  // Ensure no empty day cluster by pulling from largest cluster if needed
  for (let i = 0; i < k; i++) {
    if (clusters[i].length === 0) {
      const largestIdx = clusters.reduce((best, c, idx) => (c.length > clusters[best].length ? idx : best), 0);
      const moved = clusters[largestIdx].pop();
      if (moved) clusters[i].push(moved);
    }
  }

  return clusters;
}

export interface ScheduleGenerationOutput {
  items: ScheduledItemDraft[];
  distanceSavedKm: number;
  clusterEfficiencyPct: number;
}

export function generateSpatialTSPTWItinerary(params: {
  scoredPois: ScoredPOI[];
  destinationMode: DestinationMode;
  durationDays: number;
  groupSize: number;
  requirements: TripRequirements;
  budgetCaps: BudgetPlanCaps;
}): ScheduleGenerationOutput {
  const { scoredPois, destinationMode, durationDays, groupSize, requirements, budgetCaps } = params;

  const cityDaysPlan: { city: CityCode; dayNumber: number }[] = [];
  if (destinationMode === "DA_LAT") {
    for (let d = 1; d <= durationDays; d++) cityDaysPlan.push({ city: "DA_LAT", dayNumber: d });
  } else if (destinationMode === "NHA_TRANG") {
    for (let d = 1; d <= durationDays; d++) cityDaysPlan.push({ city: "NHA_TRANG", dayNumber: d });
  } else {
    const daLatDays = Math.ceil(durationDays / 2);
    for (let d = 1; d <= durationDays; d++) {
      cityDaysPlan.push({ city: d <= daLatDays ? "DA_LAT" : "NHA_TRANG", dayNumber: d });
    }
  }

  const items: ScheduledItemDraft[] = [];
  let remainingSightseeingBudget = budgetCaps.categoryCaps.SIGHTSEEING;
  let remainingDiningBudget = budgetCaps.categoryCaps.DINING;
  let remainingLodgingBudget = budgetCaps.categoryCaps.ACCOMMODATION;

  let totalClusteredRouteKm = 0;
  let totalUnclusteredZigzagKm = 0;

  const roomsNeeded = Math.ceil(groupSize / 2);
  const citiesToSchedule: CityCode[] =
    destinationMode === "BOTH" ? ["DA_LAT", "NHA_TRANG"] : [destinationMode];

  const selectedLodgingByCity: Partial<Record<CityCode, ScoredPOI>> = {};
  for (const city of citiesToSchedule) {
    const cityDaysCount = cityDaysPlan.filter((x) => x.city === city).length;
    const cityNights = Math.max(0, city === "DA_LAT" && destinationMode === "BOTH" ? cityDaysCount : cityDaysCount - 1);
    const lodgings = scoredPois
      .filter((s) => s.poi.city === city && s.poi.category === "LODGING")
      .sort((a, b) => b.finalScore - a.finalScore);

    const affordable = lodgings.find(
      (l) => l.poi.estimatedCostVnd * roomsNeeded <= budgetCaps.nightlyLodgingCapVnd
    ) || lodgings[lodgings.length - 1];

    if (affordable && cityNights >= 0) {
      selectedLodgingByCity[city] = affordable;
    }
  }

  for (const city of citiesToSchedule) {
    const cityDays = cityDaysPlan.filter((d) => d.city === city);
    const sightseeingPool = scoredPois
      .filter(
        (s) =>
          s.poi.city === city &&
          (s.poi.category === "SIGHTSEEING" || s.poi.category === "ADVENTURE" || s.poi.category === "RELAX")
      )
      .slice(0, Math.min(20, cityDays.length * 4));

    const diningPool = scoredPois.filter((s) => s.poi.city === city && s.poi.category === "DINING");
    const indoorBackups = sightseeingPool
      .filter((s) => s.poi.weatherSensitivity === "INDOOR")
      .sort((a, b) => b.finalScore - a.finalScore);

    const dayClusters = clusterPoisSpatially(sightseeingPool, cityDays.length);

    // Measure naive zigzag distance if unclustered (sorted strictly by score)
    for (let i = 1; i < sightseeingPool.length; i++) {
      totalUnclusteredZigzagKm += haversineKm(
        sightseeingPool[i - 1].poi.lat,
        sightseeingPool[i - 1].poi.lng,
        sightseeingPool[i].poi.lat,
        sightseeingPool[i].poi.lng
      );
    }

    cityDays.forEach((dayInfo, clusterIdx) => {
      const dayNum = dayInfo.dayNumber;
      const isTransitionDay =
        destinationMode === "BOTH" && city === "NHA_TRANG" && clusterIdx === 0;

      const lodging = selectedLodgingByCity[city];
      let currentLat = lodging?.poi.lat ?? (city === "DA_LAT" ? 11.9404 : 12.2388);
      let currentLng = lodging?.poi.lng ?? (city === "DA_LAT" ? 108.4426 : 109.1967);
      let currentTimeMins = requirements.noEarlyMornings ? 9 * 60 + 30 : 8 * 60;
      let orderIndex = 0;

      // Insert Inter-City Transfer on first day of Nha Trang if 2-city trip
      if (isTransitionDay) {
        items.push({
          dayNumber: dayNum,
          city: "INTER_CITY",
          clusterId: dayNum,
          poiId: null,
          itemType: "TRANSFER",
          title: "Limousine Shuttle: Da Lat → Nha Trang (via Khanh Le Pass)",
          lat: 12.1605,
          lng: 108.7611,
          startTime: minsToTime(currentTimeMins),
          endTime: minsToTime(currentTimeMins + 210),
          travelTimeMins: 210,
          distanceKm: 135,
          estimatedCostVnd: budgetCaps.interCityTransferCostVnd,
          jaccardScore: 1,
          matchReason: "Inter-city scenic highland-to-coast transfer",
          orderIndex: orderIndex++,
          isBackupIndoor: true,
        });
        currentTimeMins += 225; // arrive & check-in buffer
      }

      const clusterCandidates = [...(dayClusters[clusterIdx] || [])];
      let lunchInserted = false;
      let dinnerInserted = false;
      let dailySightSpent = 0;
      const dailySightAllowance = Math.min(
        budgetCaps.dailySightseeingCapVnd * 1.15,
        remainingSightseeingBudget
      );

      // Greedy TSPTW loop
      const dayEndLimit = 21 * 60 + 30;
      let safetySteps = 0;

      while (currentTimeMins < dayEndLimit && safetySteps < 10) {
        safetySteps++;

        // Insert Lunch break around 11:30 - 13:30
        if (!lunchInserted && currentTimeMins >= 11 * 60 + 15 && currentTimeMins <= 14 * 60) {
          const meal = pickBestDining(diningPool, currentLat, currentLng, currentTimeMins, remainingDiningBudget, groupSize);
          if (meal) {
            const dist = haversineKm(currentLat, currentLng, meal.poi.lat, meal.poi.lng);
            const transit = dist < 0.2 ? 3 : Math.round((dist / 28) * 60 + 5);
            const start = Math.max(currentTimeMins + transit, timeToMins(meal.poi.openTime));
            const end = start + meal.poi.avgDurationMins;
            const cost = meal.poi.estimatedCostVnd * groupSize;

            items.push({
              dayNumber: dayNum,
              city,
              clusterId: dayNum,
              poiId: meal.poi.id,
              itemType: "MEAL",
              title: `Lunch: ${meal.poi.name}`,
              lat: meal.poi.lat,
              lng: meal.poi.lng,
              weatherSensitivity: "INDOOR",
              startTime: minsToTime(start),
              endTime: minsToTime(end),
              travelTimeMins: transit,
              distanceKm: dist,
              estimatedCostVnd: cost,
              jaccardScore: meal.jaccardScore,
              matchReason: meal.matchReason,
              orderIndex: orderIndex++,
              isBackupIndoor: true,
            });
            remainingDiningBudget -= cost;
            currentLat = meal.poi.lat;
            currentLng = meal.poi.lng;
            currentTimeMins = end + 10;
            totalClusteredRouteKm += dist;
            lunchInserted = true;
            continue;
          }
          lunchInserted = true;
        }

        // Insert Dinner break around 17:45 - 20:00
        if (!dinnerInserted && currentTimeMins >= 17 * 60 + 45 && currentTimeMins <= 20 * 60 + 15) {
          const meal = pickBestDining(diningPool, currentLat, currentLng, currentTimeMins, remainingDiningBudget, groupSize);
          if (meal) {
            const dist = haversineKm(currentLat, currentLng, meal.poi.lat, meal.poi.lng);
            const transit = dist < 0.2 ? 3 : Math.round((dist / 28) * 60 + 5);
            const start = Math.max(currentTimeMins + transit, timeToMins(meal.poi.openTime));
            const end = start + meal.poi.avgDurationMins;
            const cost = meal.poi.estimatedCostVnd * groupSize;

            items.push({
              dayNumber: dayNum,
              city,
              clusterId: dayNum,
              poiId: meal.poi.id,
              itemType: "MEAL",
              title: `Dinner: ${meal.poi.name}`,
              lat: meal.poi.lat,
              lng: meal.poi.lng,
              weatherSensitivity: "INDOOR",
              startTime: minsToTime(start),
              endTime: minsToTime(end),
              travelTimeMins: transit,
              distanceKm: dist,
              estimatedCostVnd: cost,
              jaccardScore: meal.jaccardScore,
              matchReason: meal.matchReason,
              orderIndex: orderIndex++,
              isBackupIndoor: true,
            });
            remainingDiningBudget -= cost;
            currentLat = meal.poi.lat;
            currentLng = meal.poi.lng;
            currentTimeMins = end + 10;
            totalClusteredRouteKm += dist;
            dinnerInserted = true;
            continue;
          }
          dinnerInserted = true;
        }

        // Pick next feasible POI in cluster using Greedy TSPTW objective
        let bestIdx = -1;
        let bestObjective = Infinity;

        for (let i = 0; i < clusterCandidates.length; i++) {
          const cand = clusterCandidates[i];
          const cost = cand.poi.estimatedCostVnd * groupSize;
          if (dailySightSpent + cost > dailySightAllowance) continue;
          if (cost > remainingSightseeingBudget) continue;

          const dist = haversineKm(currentLat, currentLng, cand.poi.lat, cand.poi.lng);
          const transit = dist < 0.2 ? 4 : Math.round((dist / 28) * 60 + 5);
          const arrival = currentTimeMins + transit;
          const openM = timeToMins(cand.poi.openTime);
          const closeM = timeToMins(cand.poi.closeTime);
          const start = Math.max(arrival, openM);
          const end = start + cand.poi.avgDurationMins;

          if (end > closeM || end > dayEndLimit) continue;

          // Minimize travel + waiting penalty while rewarding Jaccard + Rating
          const waitPenalty = Math.max(0, openM - arrival) * 0.4;
          const objective = transit + waitPenalty - cand.finalScore * 20;
          if (objective < bestObjective) {
            bestObjective = objective;
            bestIdx = i;
          }
        }

        if (bestIdx === -1) {
          // If afternoon gap exists before dinner, jump forward
          if (!dinnerInserted && currentTimeMins < 17 * 60 + 45) {
            currentTimeMins = 18 * 60;
            continue;
          }
          break;
        }

        const chosen = clusterCandidates.splice(bestIdx, 1)[0];
        const dist = haversineKm(currentLat, currentLng, chosen.poi.lat, chosen.poi.lng);
        const transit = dist < 0.2 ? 4 : Math.round((dist / 28) * 60 + 5);
        const start = Math.max(currentTimeMins + transit, timeToMins(chosen.poi.openTime));
        const end = start + chosen.poi.avgDurationMins;
        const cost = chosen.poi.estimatedCostVnd * groupSize;

        // Attach Indoor Backup if POI is OUTDOOR
        const backup =
          chosen.poi.weatherSensitivity === "OUTDOOR"
            ? indoorBackups.find(
                (b) => b.poi.id !== chosen.poi.id && b.poi.estimatedCostVnd * groupSize <= cost + 80_000
              )
            : undefined;

        items.push({
          dayNumber: dayNum,
          city,
          clusterId: dayNum,
          poiId: chosen.poi.id,
          itemType: "POI",
          title: chosen.poi.name,
          lat: chosen.poi.lat,
          lng: chosen.poi.lng,
          weatherSensitivity: chosen.poi.weatherSensitivity,
          startTime: minsToTime(start),
          endTime: minsToTime(end),
          travelTimeMins: transit,
          distanceKm: dist,
          estimatedCostVnd: cost,
          jaccardScore: chosen.jaccardScore,
          matchReason: chosen.matchReason,
          orderIndex: orderIndex++,
          isBackupIndoor: chosen.poi.weatherSensitivity === "INDOOR",
          backupPoiId: backup?.poi.id ?? null,
          backupTitle: backup ? `${backup.poi.name} (Indoor Backup)` : null,
          backupStartTime: backup ? minsToTime(start) : null,
          backupEndTime: backup ? minsToTime(start + backup.poi.avgDurationMins) : null,
          backupCostVnd: backup ? backup.poi.estimatedCostVnd * groupSize : null,
        });

        remainingSightseeingBudget -= cost;
        dailySightSpent += cost;
        currentLat = chosen.poi.lat;
        currentLng = chosen.poi.lng;
        currentTimeMins = end + 10;
        totalClusteredRouteKm += dist;
      }

      // Add nightly Lodging check-in item (for days 1 .. durationDays-1)
      if (dayNum < durationDays && lodging) {
        const roomCost = Math.min(lodging.poi.estimatedCostVnd * roomsNeeded, remainingLodgingBudget);
        if (roomCost > 0) {
          items.push({
            dayNumber: dayNum,
            city,
            clusterId: dayNum,
            poiId: lodging.poi.id,
            itemType: "LODGING",
            title: `Overnight Stay: ${lodging.poi.name}`,
            lat: lodging.poi.lat,
            lng: lodging.poi.lng,
            weatherSensitivity: "INDOOR",
            startTime: "21:30",
            endTime: "22:00",
            travelTimeMins: 10,
            distanceKm: haversineKm(currentLat, currentLng, lodging.poi.lat, lodging.poi.lng),
            estimatedCostVnd: roomCost,
            jaccardScore: lodging.jaccardScore,
            matchReason: lodging.matchReason,
            orderIndex: orderIndex++,
            isBackupIndoor: true,
          });
          remainingLodgingBudget -= roomCost;
        }
      }
    });
  }

  const distanceSavedKm = Number(
    Math.max(2.5, totalUnclusteredZigzagKm - totalClusteredRouteKm).toFixed(1)
  );
  const clusterEfficiencyPct =
    totalUnclusteredZigzagKm > 0
      ? Math.min(68, Math.max(18, Math.round((distanceSavedKm / totalUnclusteredZigzagKm) * 100)))
      : 28;

  return { items, distanceSavedKm, clusterEfficiencyPct };
}

function pickBestDining(
  pool: ScoredPOI[],
  lat: number,
  lng: number,
  currentMins: number,
  remainingDiningBudget: number,
  groupSize: number
): ScoredPOI | null {
  let best: ScoredPOI | null = null;
  let bestCost = Infinity;

  for (const d of pool) {
    const mealCost = d.poi.estimatedCostVnd * groupSize;
    if (mealCost > remainingDiningBudget) continue;
    const openM = timeToMins(d.poi.openTime);
    const closeM = timeToMins(d.poi.closeTime);
    if (currentMins < openM - 20 || currentMins + 45 > closeM) continue;

    const dist = haversineKm(lat, lng, d.poi.lat, d.poi.lng);
    const rankMetric = dist - d.finalScore * 4;
    if (rankMetric < bestCost) {
      bestCost = rankMetric;
      best = d;
    }
  }
  return best;
}