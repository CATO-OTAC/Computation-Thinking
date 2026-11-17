import {
  BudgetCategory,
  BudgetCategoryAllocation,
  DestinationMode,
  ScheduledItemDraft,
} from "@/types/travel";

export interface BudgetPlanCaps {
  totalBudgetMaxVnd: number;
  categoryCaps: Record<BudgetCategory, number>;
  dailySightseeingCapVnd: number;
  dailyDiningCapVnd: number;
  nightlyLodgingCapVnd: number;
  interCityTransferCostVnd: number;
  dailyLocalTransportVnd: number;
  contingenciesReserveVnd: number;
}

export function allocateBudgetHardCeiling(
  budgetMaxVnd: number,
  durationDays: number,
  groupSize: number,
  destinationMode: DestinationMode
): BudgetPlanCaps {
  const isTwoCity = destinationMode === "BOTH";
  const interCityTransferCostVnd = isTwoCity ? 320_000 * groupSize : 0;

  // 1. Reserve Contingencies (8%) immediately so total never hits 100% fragility
  const contingenciesReserveVnd = Math.round(budgetMaxVnd * 0.08);

  // 2. Transportation allocation (15% single city, 22% two cities)
  const rawTransportCap = Math.round(budgetMaxVnd * (isTwoCity ? 0.22 : 0.15));
  const transportCap = Math.max(rawTransportCap, interCityTransferCostVnd);
  const localTransportPool = Math.max(0, transportCap - interCityTransferCostVnd);
  const dailyLocalTransportVnd = Math.floor(localTransportPool / durationDays);

  // 3. Distribute remaining budget strictly across Accommodation, Dining, Sightseeing
  const remainingPool = Math.max(0, budgetMaxVnd - contingenciesReserveVnd - transportCap);
  const accommodationCap = Math.round(remainingPool * 0.42);
  const diningCap = Math.round(remainingPool * 0.36);
  const sightseeingCap = Math.max(0, remainingPool - accommodationCap - diningCap);

  const nights = Math.max(1, durationDays - 1);

  return {
    totalBudgetMaxVnd: budgetMaxVnd,
    categoryCaps: {
      TRANSPORTATION: transportCap,
      ACCOMMODATION: accommodationCap,
      DINING: diningCap,
      SIGHTSEEING: sightseeingCap,
      CONTINGENCIES: contingenciesReserveVnd,
    },
    dailySightseeingCapVnd: Math.floor(sightseeingCap / durationDays),
    dailyDiningCapVnd: Math.floor(diningCap / durationDays),
    nightlyLodgingCapVnd: Math.floor(accommodationCap / nights),
    interCityTransferCostVnd,
    dailyLocalTransportVnd,
    contingenciesReserveVnd,
  };
}

export function finalizeBudgetBreakdown(
  caps: BudgetPlanCaps,
  items: ScheduledItemDraft[],
  durationDays: number
): {
  breakdowns: BudgetCategoryAllocation[];
  projectedTotalVnd: number;
  withinCeiling: boolean;
} {
  const dailyMap = (category: BudgetCategory) =>
    Array.from({ length: durationDays }, (_, i) => ({ day: i + 1, amountVnd: 0, category }));

  const dailySight = dailyMap("SIGHTSEEING");
  const dailyDining = dailyMap("DINING");
  const dailyLodging = dailyMap("ACCOMMODATION");
  const dailyTransport = dailyMap("TRANSPORTATION");
  const dailyContingency = dailyMap("CONTINGENCIES");

  for (const item of items) {
    const idx = Math.min(durationDays - 1, Math.max(0, item.dayNumber - 1));
    if (item.itemType === "POI") dailySight[idx].amountVnd += item.estimatedCostVnd;
    else if (item.itemType === "MEAL") dailyDining[idx].amountVnd += item.estimatedCostVnd;
    else if (item.itemType === "LODGING") dailyLodging[idx].amountVnd += item.estimatedCostVnd;
    else if (item.itemType === "TRANSFER") dailyTransport[idx].amountVnd += item.estimatedCostVnd;
  }

  // Add projected daily local transit (grab/taxi/scooter), bounded strictly by cap
  let runningTransport = dailyTransport.reduce((s, d) => s + d.amountVnd, 0);
  for (let d = 0; d < durationDays; d++) {
    const addLocal = Math.min(caps.dailyLocalTransportVnd, Math.max(0, caps.categoryCaps.TRANSPORTATION - runningTransport));
    dailyTransport[d].amountVnd += addLocal;
    runningTransport += addLocal;

    // Contingency buffer per day (sum <= contingenciesReserveVnd)
    dailyContingency[d].amountVnd = Math.floor(caps.contingenciesReserveVnd / durationDays);
  }

  const sumDaily = (arr: { day: number; amountVnd: number }[]) =>
    arr.reduce((acc, x) => acc + x.amountVnd, 0);

  const breakdowns: BudgetCategoryAllocation[] = [
    {
      category: "TRANSPORTATION",
      allocatedVnd: caps.categoryCaps.TRANSPORTATION,
      projectedVnd: sumDaily(dailyTransport),
      dailyBreakdown: dailyTransport.map(({ day, amountVnd }) => ({ day, amountVnd })),
    },
    {
      category: "ACCOMMODATION",
      allocatedVnd: caps.categoryCaps.ACCOMMODATION,
      projectedVnd: sumDaily(dailyLodging),
      dailyBreakdown: dailyLodging.map(({ day, amountVnd }) => ({ day, amountVnd })),
    },
    {
      category: "DINING",
      allocatedVnd: caps.categoryCaps.DINING,
      projectedVnd: sumDaily(dailyDining),
      dailyBreakdown: dailyDining.map(({ day, amountVnd }) => ({ day, amountVnd })),
    },
    {
      category: "SIGHTSEEING",
      allocatedVnd: caps.categoryCaps.SIGHTSEEING,
      projectedVnd: sumDaily(dailySight),
      dailyBreakdown: dailySight.map(({ day, amountVnd }) => ({ day, amountVnd })),
    },
    {
      category: "CONTINGENCIES",
      allocatedVnd: caps.categoryCaps.CONTINGENCIES,
      projectedVnd: sumDaily(dailyContingency),
      dailyBreakdown: dailyContingency.map(({ day, amountVnd }) => ({ day, amountVnd })),
    },
  ];

  const projectedTotalVnd = breakdowns.reduce((s, b) => s + b.projectedVnd, 0);

  return {
    breakdowns,
    projectedTotalVnd,
    withinCeiling: projectedTotalVnd <= caps.totalBudgetMaxVnd,
  };
}