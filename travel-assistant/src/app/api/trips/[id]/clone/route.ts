import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSessionUser } from "@/lib/auth";
import { generateAndPersistTrip } from "@/lib/modules/orchestrator";
import { DestinationMode } from "@/types/travel";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please log in to clone this plan." }, { status: 401 });

  const source = await prisma.trip.findUnique({ where: { id: params.id } });
  if (!source) return NextResponse.json({ error: "Source plan not found" }, { status: 404 });
  if (!source.isPublicCommunity && source.userId !== user.userId && user.role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const overrides = await req.json().catch(() => ({}));

  await prisma.trip.update({
    where: { id: source.id },
    data: { cloneCount: { increment: 1 } },
  });

  const result = await generateAndPersistTrip(user.userId, {
    title: overrides.title || `${source.title} (My Copy)`,
    destinationMode: source.destinationMode as DestinationMode,
    startDate: overrides.startDate || source.startDate,
    endDate: overrides.endDate || source.endDate,
    groupSize: overrides.groupSize || source.groupSize,
    budgetMaxVnd: overrides.budgetMaxVnd || source.budgetMaxVnd,
    vibes: JSON.parse(source.selectedVibes || "[]"),
    requirements: JSON.parse(source.requirements || "{}"),
    isPublicCommunity: false,
  });

  if (!result.ok) return NextResponse.json(result, { status: 400 });
  return NextResponse.json(result);
}
