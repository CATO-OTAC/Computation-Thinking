import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSessionUser } from "@/lib/auth";
import { TripRepository } from "@/lib/db/repositories";
import { finalizeBudgetBreakdown, allocateBudgetHardCeiling } from "@/lib/modules/moduleC-budget";
import { DestinationMode } from "@/types/travel";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const trip = await TripRepository.findByIdWithDetails(params.id);
  if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  const user = await getSessionUser();
  if (!trip.isPublicCommunity && (!user || (trip.userId !== user.userId && user.role !== "MANAGER"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ trip });
}

// Live POI Swap + Budget Re-Check
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId, newPoiId } = await req.json();
  const trip = await TripRepository.findByIdWithDetails(params.id);
  if (!trip || (trip.userId !== user.userId && user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const newPoi = await prisma.pOI.findUnique({ where: { id: newPoiId } });
  const targetItem = trip.itineraryItems.find((i) => i.id === itemId);
  if (!newPoi || !targetItem) {
    return NextResponse.json({ error: "Item or POI not found" }, { status: 404 });
  }

  const newCost = newPoi.estimatedCostVnd * trip.groupSize;
  const deltaCost = newCost - targetItem.estimatedCostVnd;

  if (trip.projectedTotalVnd + deltaCost > trip.budgetMaxVnd) {
    return NextResponse.json(
      {
        error: `Cannot swap: adding ${newPoi.name} exceeds your hard budget ceiling (${trip.budgetMaxVnd.toLocaleString(
          "vi-VN"
        )} VND). Increase budget slider to unlock.`,
      },
      { status: 400 }
    );
  }

  await prisma.itineraryItem.update({
    where: { id: itemId },
    data: {
      poiId: newPoi.id,
      title: targetItem.itemType === "MEAL" ? `Meal: ${newPoi.name}` : newPoi.name,
      estimatedCostVnd: newCost,
      isBackupIndoor: newPoi.weatherSensitivity === "INDOOR",
      matchReason: "Customized manually by traveler (Hard ceiling verified)",
    },
  });

  // Re-run Module C finalization
  const updatedItems = await prisma.itineraryItem.findMany({
    where: { tripId: trip.id },
    orderBy: [{ dayNumber: "asc" }, { orderIndex: "asc" }],
  });

  const caps = allocateBudgetHardCeiling(
    trip.budgetMaxVnd,
    trip.durationDays,
    trip.groupSize,
    trip.destinationMode as DestinationMode
  );
  const finalized = finalizeBudgetBreakdown(
    caps,
    updatedItems.map((i) => ({
      ...i,
      itemType: i.itemType as "POI" | "MEAL" | "LODGING" | "TRANSFER",
    })),
    trip.durationDays
  );

  await prisma.budgetBreakdown.deleteMany({ where: { tripId: trip.id } });
  for (const b of finalized.breakdowns) {
    await prisma.budgetBreakdown.create({
      data: {
        tripId: trip.id,
        category: b.category,
        allocatedVnd: b.allocatedVnd,
        projectedVnd: b.projectedVnd,
        dailyBreakdownJson: JSON.stringify(b.dailyBreakdown),
      },
    });
  }

  await prisma.trip.update({
    where: { id: trip.id },
    data: { projectedTotalVnd: finalized.projectedTotalVnd },
  });

  return NextResponse.json({ ok: true, projectedTotalVnd: finalized.projectedTotalVnd });
}