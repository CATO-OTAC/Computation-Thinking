import { DestinationMode, ScheduledItemDraft } from "@/types/travel";

export interface ChecklistItem {
  id: string;
  category: "Apparel" | "Gear" | "Health & Safety" | "Documents";
  item: string;
  checked: boolean;
}

export interface RiskWarning {
  city: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  detail: string;
}

export function generateContextualAdvisory(
  destinationMode: DestinationMode,
  startDate: string,
  items: ScheduledItemDraft[]
): {
  checklist: ChecklistItem[];
  warnings: RiskWarning[];
  indoorBackupCount: number;
} {
  const month = new Date(startDate).getMonth() + 1;
  const isRainySeason = month >= 5 && month <= 10;
  const includesDaLat = destinationMode === "DA_LAT" || destinationMode === "BOTH";
  const includesNhaTrang = destinationMode === "NHA_TRANG" || destinationMode === "BOTH";

  const checklist: ChecklistItem[] = [
    { id: "doc-1", category: "Documents", item: "National ID / Passport & e-tickets", checked: false },
    { id: "doc-2", category: "Documents", item: "Offline Google Maps & emergency contacts", checked: false },
  ];

  const warnings: RiskWarning[] = [];

  if (includesDaLat) {
    checklist.push(
      { id: "dl-1", category: "Apparel", item: "Warm jacket / thermal layer (Da Lat drops to 14°C at night)", checked: false },
      { id: "dl-2", category: "Gear", item: "Compact waterproof raincoat or foldable umbrella", checked: false },
      { id: "dl-3", category: "Apparel", item: "Non-slip walking shoes for pine trails & waterfalls", checked: false }
    );
    warnings.push({
      city: "DA_LAT",
      severity: isRainySeason ? "HIGH" : "MEDIUM",
      title: isRainySeason ? "Highland Afternoon Showers & Slippery Trails" : "Evening Highland Chill & Morning Fog",
      detail: isRainySeason
        ? "May–Oct brings sudden afternoon rain around Datanla & Langbiang. Use the Indoor Backup Toggle if showers hit."
        : "Expect dense early morning mist on mountain passes and sharp temperature drops after 17:30.",
    });
  }

  if (includesNhaTrang) {
    checklist.push(
      { id: "nt-1", category: "Health & Safety", item: "SPF 50+ reef-safe sunscreen & UV sunglasses", checked: false },
      { id: "nt-2", category: "Apparel", item: "Breathable swimwear, quick-dry towel & wide-brim hat", checked: false },
      { id: "nt-3", category: "Gear", item: "Waterproof phone pouch for Hon Mun / island boats", checked: false }
    );
    warnings.push({
      city: "NHA_TRANG",
      severity: "MEDIUM",
      title: "High Coastal UV Index & Sea Swell Advisory",
      detail: "Midday UV index peaks 11:00–14:30. Hydrate frequently and verify marine conditions before Hon Mun boat departures.",
    });
  }

  if (destinationMode === "BOTH") {
    warnings.push({
      city: "INTER_CITY",
      severity: "MEDIUM",
      title: "Khanh Le Mountain Pass (QL27C) Transit",
      detail: "3.5-hour winding mountain descent between Da Lat and Nha Trang. Pack motion-sickness tablets if sensitive.",
    });
  }

  const indoorBackupCount = items.filter((i) => i.itemType === "POI" && i.backupTitle).length;

  return { checklist, warnings, indoorBackupCount };
}