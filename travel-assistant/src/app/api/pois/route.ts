import { NextResponse } from "next/server";
import { POIRepository } from "@/lib/db/repositories";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city") || undefined;
  const pois = await POIRepository.findAll(city);
  return NextResponse.json({ pois });
}