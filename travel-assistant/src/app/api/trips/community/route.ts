import { NextResponse } from "next/server";
import { TripRepository } from "@/lib/db/repositories";

export async function GET() {
  const plans = await TripRepository.findTopCommunityPlans(6);
  return NextResponse.json({ plans });
}