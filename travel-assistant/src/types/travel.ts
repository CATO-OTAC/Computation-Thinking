export type DestinationMode = "DA_LAT" | "NHA_TRANG" | "BOTH";
export type CityCode = "DA_LAT" | "NHA_TRANG";
export type POICategory = "SIGHTSEEING" | "DINING" | "LODGING" | "ADVENTURE" | "RELAX";
export type WeatherSensitivity = "INDOOR" | "OUTDOOR";
export type BudgetCategory =
  | "TRANSPORTATION"
  | "ACCOMMODATION"
  | "DINING"
  | "SIGHTSEEING"
  | "CONTINGENCIES";

export interface TripRequirements {
  wheelchairAccessible: boolean;
  vegetarian: boolean;
  noEarlyMornings: boolean;
}

export interface TripInputPayload {
  title?: string;
  destinationMode: DestinationMode;
  startDate: string;
  endDate: string;
  groupSize: number;
  budgetMaxVnd: number;
  vibes: string[];
  requirements: TripRequirements;
  isPublicCommunity?: boolean;
}

export interface FeasibilityResult {
  valid: boolean;
  feasible: boolean;
  durationDays: number;
  minRecommendedBudgetVnd: number;
  errors: string[];
  warnings: string[];
  parsedInput: TripInputPayload;
}

export interface POIRecord {
  id: string;
  name: string;
  city: CityCode;
  description: string;
  lat: number;
  lng: number;
  category: POICategory;
  tags: string[];
  estimatedCostVnd: number;
  avgDurationMins: number;
  openTime: string;
  closeTime: string;
  weatherSensitivity: WeatherSensitivity;
  terrainType: string;
  wheelchairAccessible: boolean;
  vegetarianFriendly: boolean;
  avgRating: number;
  reviewCount: number;
}

export interface ScoredPOI {
  poi: POIRecord;
  jaccardScore: number;
  ratingBoost: number;
  finalScore: number;
  matchedTags: string[];
  matchReason: string;
}

export interface BudgetCategoryAllocation {
  category: BudgetCategory;
  allocatedVnd: number;
  projectedVnd: number;
  dailyBreakdown: { day: number; amountVnd: number }[];
}

export interface ScheduledItemDraft {
  dayNumber: number;
  city: string;
  clusterId: number;
  poiId: string | null;
  itemType: "POI" | "MEAL" | "LODGING" | "TRANSFER";
  title: string;
  lat?: number;
  lng?: number;
  weatherSensitivity?: WeatherSensitivity;
  startTime: string;
  endTime: string;
  travelTimeMins: number;
  distanceKm: number;
  estimatedCostVnd: number;
  jaccardScore: number;
  matchReason: string;
  orderIndex: number;
  isBackupIndoor: boolean;
  backupPoiId?: string | null;
  backupTitle?: string | null;
  backupStartTime?: string | null;
  backupEndTime?: string | null;
  backupCostVnd?: number | null;
}