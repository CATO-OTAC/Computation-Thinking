import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { TripRepository } from "@/lib/db/repositories";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const trips = await TripRepository.findUserTrips(user.userId);
  return NextResponse.json({ trips });
}