import { prisma } from "./prisma";
import { CityCode, POICategory, POIRecord, WeatherSensitivity } from "@/types/travel";

function parseTags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function mapPoiToDomain(row: {
  id: string;
  name: string;
  city: string;
  description: string;
  lat: number;
  lng: number;
  category: string;
  tags: string;
  estimatedCostVnd: number;
  avgDurationMins: number;
  openTime: string;
  closeTime: string;
  weatherSensitivity: string;
  terrainType: string;
  wheelchairAccessible: boolean;
  vegetarianFriendly: boolean;
  avgRating: number;
  reviewCount: number;
}): POIRecord {
  return {
    ...row,
    city: row.city as CityCode,
    category: row.category as POICategory,
    weatherSensitivity: row.weatherSensitivity as WeatherSensitivity,
    tags: parseTags(row.tags),
  };
}

export const POIRepository = {
  async findAll(cityFilter?: string): Promise<POIRecord[]> {
    const rows = await prisma.pOI.findMany({
      where: cityFilter ? { city: cityFilter } : undefined,
      orderBy: { avgRating: "desc" },
    });
    return rows.map(mapPoiToDomain);
  },

  async findByCities(cities: CityCode[]): Promise<POIRecord[]> {
    const rows = await prisma.pOI.findMany({
      where: { city: { in: cities } },
    });
    return rows.map(mapPoiToDomain);
  },

  async create(data: Omit<POIRecord, "id" | "avgRating" | "reviewCount">) {
    const row = await prisma.pOI.create({
      data: {
        ...data,
        tags: JSON.stringify(data.tags),
      },
    });
    return mapPoiToDomain(row);
  },

  async update(id: string, data: Partial<Omit<POIRecord, "id">>) {
    const row = await prisma.pOI.update({
      where: { id },
      data: {
        ...data,
        tags: data.tags ? JSON.stringify(data.tags) : undefined,
      },
    });
    return mapPoiToDomain(row);
  },

  async delete(id: string) {
    return prisma.pOI.delete({ where: { id } });
  },
};

export const TripRepository = {
  async findByIdWithDetails(id: string) {
    return prisma.trip.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        itineraryItems: {
          orderBy: [{ dayNumber: "asc" }, { orderIndex: "asc" }],
          include: { poi: true },
        },
        budgetBreakdowns: true,
        reviews: {
          orderBy: { createdAt: "desc" },
          include: { user: { select: { name: true } }, poi: { select: { name: true } } },
        },
      },
    });
  },

  async findUserTrips(userId: string) {
    return prisma.trip.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        budgetBreakdowns: true,
        _count: { select: { itineraryItems: true, reviews: true } },
      },
    });
  },

  async findTopCommunityPlans(limit = 6) {
    return prisma.trip.findMany({
      where: { isPublicCommunity: true },
      orderBy: [{ avgRating: "desc" }, { reviewCount: "desc" }, { cloneCount: "desc" }],
      take: limit,
      include: {
        user: { select: { name: true } },
        itineraryItems: {
          take: 4,
          orderBy: [{ dayNumber: "asc" }, { orderIndex: "asc" }],
          select: { title: true, city: true, jaccardScore: true },
        },
      },
    });
  },
};