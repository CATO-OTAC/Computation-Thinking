import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { POIRepository } from "@/lib/db/repositories";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "MANAGER") {
    return NextResponse.json({ error: "Manager access required" }, { status: 403 });
  }
  const body = await req.json();
  const poi = await POIRepository.create({
    name: body.name,
    city: body.city,
    description: body.description || "",
    lat: Number(body.lat),
    lng: Number(body.lng),
    category: body.category,
    tags: Array.isArray(body.tags) ? body.tags : String(body.tags || "").split(",").map((s: string) => s.trim()).filter(Boolean),
    estimatedCostVnd: Number(body.estimatedCostVnd),
    avgDurationMins: Number(body.avgDurationMins || 60),
    openTime: body.openTime || "08:00",
    closeTime: body.closeTime || "18:00",
    weatherSensitivity: body.weatherSensitivity || "OUTDOOR",
    terrainType: body.terrainType || "URBAN",
    wheelchairAccessible: Boolean(body.wheelchairAccessible),
    vegetarianFriendly: Boolean(body.vegetarianFriendly),
  });
  return NextResponse.json({ poi }, { status: 201 });
}