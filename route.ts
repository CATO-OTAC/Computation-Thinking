import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { submitReviewAndUpdateLoop } from "@/lib/modules/moduleF-feedback";

const SURVEY_QUESTIONS: Record<string, string> = {
  Q1: "UI",
  Q2: "Performance",
  Q3: "Input_Usability",
  Q4: "Destination",
  Q5: "Schedule",
  Q6: "Rest_Time",
  Q7: "Cost",
  Q8: "Satisfaction",
  Q9: "Retention",
  Q10: "Recommendation",
};

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });

    const body = await req.json();

    // Structured post-trip survey: persist answers as Review rows, reusing the existing table.
    if (Array.isArray(body.answers)) {
      const tripId = String(body.tripId || "");
      const answers = body.answers as Array<{ questionId: string; tag: string; score: number; answerText?: string }>;
      if (!tripId || answers.length !== 10) {
        return NextResponse.json({ error: "Khảo sát phải có đủ 10 câu trả lời." }, { status: 400 });
      }

      const seen = new Set<string>();
      for (const answer of answers) {
        const expectedTag = SURVEY_QUESTIONS[answer.questionId];
        if (!expectedTag || expectedTag !== answer.tag || !Number.isInteger(answer.score) || answer.score < 1 || answer.score > 5 || seen.has(answer.questionId)) {
          return NextResponse.json({ error: "Dữ liệu câu trả lời không hợp lệ." }, { status: 400 });
        }
        seen.add(answer.questionId);
      }
      if (seen.size !== 10) return NextResponse.json({ error: "Thiếu câu trả lời khảo sát." }, { status: 400 });

      const trip = await prisma.trip.findUnique({ where: { id: tripId }, select: { userId: true } });
      if (!trip) return NextResponse.json({ error: "Không tìm thấy chuyến đi." }, { status: 404 });
      if (trip.userId !== user.userId) return NextResponse.json({ error: "Bạn chỉ có thể đánh giá chuyến đi của mình." }, { status: 403 });

      const existing = await prisma.review.findFirst({
        where: { tripId, userId: user.userId, aspectLabel: { startsWith: "SURVEY_" } },
        select: { id: true },
      });
      if (existing) return NextResponse.json({ error: "Bạn đã gửi khảo sát cho chuyến đi này rồi." }, { status: 409 });

      await prisma.$transaction([
        ...answers.map((answer) => prisma.review.create({
          data: {
            tripId,
            userId: user.userId,
            poiId: null,
            rating: answer.score,
            comment: `${answer.questionId}: ${String(answer.answerText || "").slice(0, 300)}`,
            aspectLabel: `SURVEY_${answer.questionId}_${answer.tag}`,
            sentiment: answer.score >= 4 ? "POSITIVE" : answer.score <= 2 ? "NEGATIVE" : "NEUTRAL",
          },
        })),
      ]);

      return NextResponse.json({ success: true, message: "Đã lưu khảo sát gồm 10 câu trả lời." });
    }

    // Keep the original review endpoint behavior for existing POI / trip reviews.
    const { tripId, poiId, rating, comment, aspectLabel } = body;
    const numericRating = Number(rating);
    if (!tripId || !Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return NextResponse.json({ error: "Valid tripId and rating (1-5) required." }, { status: 400 });
    }
    const trip = await prisma.trip.findUnique({
      where: { id: String(tripId) },
      select: { userId: true, itineraryItems: { select: { poiId: true } } },
    });
    if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    if (trip.userId !== user.userId) return NextResponse.json({ error: "You can only review your own trips." }, { status: 403 });
    if (poiId && !trip.itineraryItems.some((item) => item.poiId === poiId)) {
      return NextResponse.json({ error: "POI is not part of this trip." }, { status: 400 });
    }
    const review = await submitReviewAndUpdateLoop({
      tripId, userId: user.userId, poiId: poiId || null, rating: numericRating,
      comment: String(comment || "").trim(), aspectLabel: aspectLabel || "OVERALL",
    });
    return NextResponse.json({ review });
  } catch (error) {
    console.error("POST /api/reviews failed:", error);
    return NextResponse.json({ error: "Không thể lưu đánh giá. Vui lòng thử lại." }, { status: 500 });
  }
}
