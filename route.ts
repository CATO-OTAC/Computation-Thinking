import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "MANAGER") {
    return NextResponse.json({ error: "Manager access required" }, { status: 403 });
  }

  const [trips, pois, reviews, logs] = await Promise.all([
    prisma.trip.findMany({ include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.pOI.findMany({ orderBy: { avgRating: "desc" } }),
    prisma.review.findMany({
      include: { user: { select: { name: true } }, poi: { select: { name: true } }, trip: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.recommendationLog.findMany({
      include: { user: { select: { name: true } }, trip: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const totalTrips = trips.length;
  const avgBudget = totalTrips ? Math.round(trips.reduce((s, t) => s + t.budgetMaxVnd, 0) / totalTrips) : 0;
  const avgGroupSize = totalTrips ? Number((trips.reduce((s, t) => s + t.groupSize, 0) / totalTrips).toFixed(1)) : 0;
  const avgSatisfaction = reviews.length
    ? Number((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(2))
    : 4.8;

  const destinationCounts: Record<string, number> = { DA_LAT: 0, NHA_TRANG: 0, BOTH: 0 };
  const vibeCounts: Record<string, number> = {};
  for (const t of trips) {
    destinationCounts[t.destinationMode] = (destinationCounts[t.destinationMode] || 0) + 1;
    const vibes: string[] = JSON.parse(t.selectedVibes || "[]");
    for (const v of vibes) vibeCounts[v] = (vibeCounts[v] || 0) + 1;
  }

  const sentimentCounts = {
    POSITIVE: reviews.filter((r) => r.sentiment === "POSITIVE").length,
    NEUTRAL: reviews.filter((r) => r.sentiment === "NEUTRAL").length,
    NEGATIVE: reviews.filter((r) => r.sentiment === "NEGATIVE").length,
  };

  // Survey answers are stored in the existing Review table using SURVEY_Qx_TAG labels.
  const surveyReviews = reviews.filter((r) => r.aspectLabel.startsWith("SURVEY_Q"));
  const questionTitles: Record<string, string> = {
    Q1: "Giao diện ứng dụng", Q2: "Tốc độ phản hồi", Q3: "Thuận tiện khi nhập thông tin",
    Q4: "Địa điểm phù hợp sở thích", Q5: "Phân bổ thời gian", Q6: "Thời gian nghỉ ngơi",
    Q7: "Độ chính xác chi phí", Q8: "Hài lòng tổng thể", Q9: "Ý định tiếp tục sử dụng",
    Q10: "Ý định giới thiệu ứng dụng",
  };
  const questionStats = Object.entries(questionTitles).map(([questionId, title]) => {
    const rows = surveyReviews.filter((r) => r.aspectLabel.startsWith(`SURVEY_${questionId}_`));
    return { questionId, title, count: rows.length, averageScore: rows.length ? Number((rows.reduce((sum, r) => sum + r.rating, 0) / rows.length).toFixed(2)) : 0 };
  });
  const tagStats = Object.entries({ Q1: "UI", Q2: "Performance", Q3: "Input_Usability", Q4: "Destination", Q5: "Schedule", Q6: "Rest_Time", Q7: "Cost", Q8: "Satisfaction", Q9: "Retention", Q10: "Recommendation" }).map(([questionId, tag]) => {
    const rows = surveyReviews.filter((r) => r.aspectLabel === `SURVEY_${questionId}_${tag}`);
    return { tag, count: rows.length, averageScore: rows.length ? Number((rows.reduce((sum, r) => sum + r.rating, 0) / rows.length).toFixed(2)) : 0 };
  });
  const groupStats = [
    { group: "Nhóm 1 – Trải nghiệm sử dụng ứng dụng", ids: ["Q1", "Q2", "Q3"] },
    { group: "Nhóm 2 – Chất lượng gợi ý của ứng dụng", ids: ["Q4", "Q5", "Q6", "Q7"] },
    { group: "Nhóm 3 – Mức độ hài lòng của người dùng", ids: ["Q8", "Q9", "Q10"] },
  ].map(({ group, ids }) => {
    const rows = surveyReviews.filter((r) => ids.some((id) => r.aspectLabel.startsWith(`SURVEY_${id}_`)));
    return { group, answerCount: rows.length, averageScore: rows.length ? Number((rows.reduce((sum, r) => sum + r.rating, 0) / rows.length).toFixed(2)) : 0 };
  });

  return NextResponse.json({
    kpis: { totalTrips, totalPois: pois.length, avgBudget, avgGroupSize, avgSatisfaction, totalReviews: reviews.length },
    destinationChart: Object.entries(destinationCounts).map(([name, count]) => ({ name, count })),
    vibesChart: Object.entries(vibeCounts)
      .map(([vibe, count]) => ({ vibe, count }))
      .sort((a, b) => b.count - a.count),
    sentimentChart: Object.entries(sentimentCounts).map(([sentiment, count]) => ({ sentiment, count })),
    trips,
    reviews,
    logs,
    surveyAnalytics: { totalAnswers: surveyReviews.length, questionStats, tagStats, groupStats },
  });
}