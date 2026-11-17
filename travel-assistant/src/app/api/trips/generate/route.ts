import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSessionUser } from "@/lib/auth";
import { parseAndValidateTripInput } from "@/lib/modules/moduleA-parser";
import { generateAndPersistTrip } from "@/lib/modules/orchestrator";

export async function POST(req: Request) {
  const body = await req.json();

  // Support dry-run feasibility check in Wizard before user logs in
  if (body.checkOnly) {
    const feasibility = parseAndValidateTripInput(body);
    return NextResponse.json(feasibility);
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in to generate and save trips." }, { status: 401 });
  }

  if (body.existingTripId) {
    const existingTrip = await prisma.trip.findUnique({
      where: { id: String(body.existingTripId) },
      select: { userId: true },
    });
    if (!existingTrip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }
    if (existingTrip.userId !== user.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const result = await generateAndPersistTrip(user.userId, body, body.existingTripId);
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}