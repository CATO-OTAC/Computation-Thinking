import { FeasibilityResult, TripInputPayload } from "@/types/travel";

const MIN_DAILY_PER_PERSON_VND = 450_000;
const INTER_CITY_TRANSFER_PER_PERSON_VND = 320_000;

export function parseAndValidateTripInput(raw: Partial<TripInputPayload>): FeasibilityResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const destinationMode = raw.destinationMode || "DA_LAT";
  if (!["DA_LAT", "NHA_TRANG", "BOTH"].includes(destinationMode)) {
    errors.push("Invalid destination mode selected.");
  }

  const startDate = raw.startDate || "";
  const endDate = raw.endDate || "";
  const start = new Date(startDate);
  const end = new Date(endDate);

  let durationDays = 0;
  if (!startDate || !endDate || isNaN(start.getTime()) || isNaN(end.getTime())) {
    errors.push("Please provide valid start and end dates.");
  } else if (end < start) {
    errors.push("End date cannot be earlier than start date.");
  } else {
    durationDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (durationDays > 14) {
      errors.push("Trips longer than 14 days are outside supported planning horizons.");
    }
    if (destinationMode === "BOTH" && durationDays < 2) {
      errors.push("Planning both Da Lat & Nha Trang requires at least 2 days to accommodate inter-city travel.");
    }
  }

  const groupSize = Number(raw.groupSize ?? 0);
  if (!Number.isInteger(groupSize) || groupSize < 1) {
    errors.push("Group size must be at least 1 traveler.");
  } else if (groupSize > 30) {
    errors.push("Maximum supported group size is 30 travelers.");
  } else if (groupSize > 12) {
    warnings.push("Large group (>12): private shuttle coordination is recommended.");
  }

  const budgetMaxVnd = Number(raw.budgetMaxVnd ?? 0);
  if (!Number.isFinite(budgetMaxVnd) || budgetMaxVnd <= 0) {
    errors.push("Total budget (B_max) must be greater than 0 VND.");
  }

  const effectiveDays = Math.max(durationDays, 1);
  const effectiveGroup = Math.max(groupSize, 1);
  const transferFloor =
    destinationMode === "BOTH" ? INTER_CITY_TRANSFER_PER_PERSON_VND * effectiveGroup : 0;
  const minRecommendedBudgetVnd =
    effectiveDays * effectiveGroup * MIN_DAILY_PER_PERSON_VND + transferFloor;

  let feasible = errors.length === 0;
  if (feasible && budgetMaxVnd < minRecommendedBudgetVnd) {
    feasible = false;
    errors.push(
      `Budget ${budgetMaxVnd.toLocaleString("vi-VN")} VND is below the feasible floor of ${minRecommendedBudgetVnd.toLocaleString(
        "vi-VN"
      )} VND for ${effectiveGroup} traveler(s) over ${effectiveDays} day(s)${
        destinationMode === "BOTH" ? " including inter-city shuttle" : ""
      }.`
    );
  } else if (feasible && budgetMaxVnd < minRecommendedBudgetVnd * 1.25) {
    warnings.push("Tight budget mode: system will prioritize free/low-cost attractions and budget homestays.");
  }

  const vibes = Array.isArray(raw.vibes) ? raw.vibes.map((v) => v.toLowerCase().trim()).filter(Boolean) : [];
  if (vibes.length === 0) {
    warnings.push("No vibes selected: applying balanced discovery scoring across all categories.");
  }

  const parsedInput: TripInputPayload = {
    title:
      raw.title?.trim() ||
      `${
        destinationMode === "BOTH"
          ? "Da Lat & Nha Trang"
          : destinationMode === "DA_LAT"
          ? "Da Lat"
          : "Nha Trang"
      } (${effectiveDays}D)`,
    destinationMode,
    startDate,
    endDate,
    groupSize: effectiveGroup,
    budgetMaxVnd,
    vibes,
    requirements: {
      wheelchairAccessible: Boolean(raw.requirements?.wheelchairAccessible),
      vegetarian: Boolean(raw.requirements?.vegetarian),
      noEarlyMornings: Boolean(raw.requirements?.noEarlyMornings),
    },
    isPublicCommunity: raw.isPublicCommunity ?? true,
  };

  return {
    valid: errors.length === 0,
    feasible,
    durationDays,
    minRecommendedBudgetVnd,
    errors,
    warnings,
    parsedInput,
  };
}