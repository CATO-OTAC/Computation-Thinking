"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

const surveyGroups = [
  {
    title: "Nhóm 1. Trải nghiệm sử dụng ứng dụng",
    description: "Đánh giá giao diện và mức độ thuận tiện khi sử dụng.",
    questions: [
      { id: "Q1", tag: "UI", text: "Bạn đánh giá giao diện ứng dụng như thế nào?", options: ["Rất không hài lòng", "Không hài lòng", "Bình thường", "Hài lòng", "Rất hài lòng"] },
      { id: "Q2", tag: "Performance", text: "Bạn đánh giá tốc độ phản hồi của ứng dụng như thế nào?", options: ["Rất chậm", "Chậm", "Bình thường", "Nhanh", "Rất nhanh"] },
      { id: "Q3", tag: "Input_Usability", text: "Bạn đánh giá mức độ thuận tiện khi nhập thông tin chuyến đi như thế nào?", options: ["Rất bất tiện", "Bất tiện", "Bình thường", "Thuận tiện", "Rất thuận tiện"] },
    ],
  },
  {
    title: "Nhóm 2. Chất lượng gợi ý của ứng dụng",
    description: "Đánh giá mức độ phù hợp của địa điểm, lịch trình và chi phí.",
    questions: [
      { id: "Q4", tag: "Destination", text: "Các địa điểm du lịch được đề xuất phù hợp với sở thích của bạn ở mức độ nào?", options: ["Hoàn toàn không phù hợp", "Ít phù hợp", "Tương đối phù hợp", "Phù hợp", "Rất phù hợp"] },
      { id: "Q5", tag: "Schedule", text: "Bạn đánh giá mức độ hợp lý của việc phân bổ thời gian cho các hoạt động tham quan trong lịch trình như thế nào?", options: ["Rất không hợp lý", "Không hợp lý", "Bình thường", "Hợp lý", "Rất hợp lý"] },
      { id: "Q6", tag: "Rest_Time", text: "Bạn đánh giá thời gian nghỉ ngơi được bố trí trong lịch trình như thế nào?", options: ["Hoàn toàn không đủ", "Chưa đủ", "Tạm đủ", "Đầy đủ", "Rất thoải mái"] },
      { id: "Q7", tag: "Cost", text: "Chi phí dự kiến của chuyến đi chính xác ở mức độ nào so với thực tế?", options: ["Sai lệch rất nhiều", "Sai lệch khá nhiều", "Tương đối chính xác", "Khá chính xác", "Rất chính xác"] },
    ],
  },
  {
    title: "Nhóm 3. Mức độ hài lòng của người dùng",
    description: "Đánh giá trải nghiệm tổng thể và ý định tiếp tục sử dụng.",
    questions: [
      { id: "Q8", tag: "Satisfaction", text: "Bạn hài lòng với trải nghiệm tổng thể khi sử dụng ứng dụng ở mức độ nào?", options: ["Rất không hài lòng", "Không hài lòng", "Bình thường", "Hài lòng", "Rất hài lòng"] },
      { id: "Q9", tag: "Retention", text: "Bạn có sẵn sàng tiếp tục sử dụng ứng dụng trong tương lai không?", options: ["Chắc chắn không", "Có lẽ không", "Chưa chắc chắn", "Có thể", "Chắc chắn có"] },
      { id: "Q10", tag: "Recommendation", text: "Bạn có sẵn sàng giới thiệu ứng dụng cho người khác không?", options: ["Chắc chắn không", "Có lẽ không", "Chưa chắc chắn", "Có thể", "Chắc chắn có"] },
    ],
  },
] as const;

type Props = { tripId: string; pois?: { id: string; name: string }[]; onClose: () => void; onSubmitted: () => void };

export default function ReviewModal({ tripId, onClose, onSubmitted }: Props) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const questions = useMemo(() => surveyGroups.flatMap((group) => group.questions), []);
  const answeredCount = Object.keys(answers).length;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (answeredCount !== 10) {
      setError("Vui lòng trả lời đầy đủ cả 10 câu hỏi.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          answers: questions.map((question) => ({
            questionId: question.id,
            tag: question.tag,
            score: answers[question.id],
            answerText: question.options[answers[question.id] - 1],
          })),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "Không thể gửi khảo sát. Vui lòng thử lại.");
        return;
      }
      onSubmitted();
      onClose();
    } catch {
      setError("Không kết nối được máy chủ. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Khảo sát sau chuyến đi</h3>
            <p className="mt-1 text-sm text-slate-500">10 câu hỏi · 3 nhóm · Thang điểm 1–5</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Đóng khảo sát" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="border-b bg-slate-50 px-5 py-4">
          <div className="mb-2 flex justify-between text-sm"><span className="font-semibold text-slate-700">Tiến độ khảo sát</span><span className="font-semibold text-teal-700">{answeredCount}/10 câu</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${answeredCount * 10}%` }} /></div>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 space-y-7 overflow-y-auto p-5">
          {surveyGroups.map((group) => (
            <section key={group.title}>
              <div className="mb-4 border-l-4 border-teal-600 pl-3"><h4 className="font-bold text-slate-900">{group.title}</h4><p className="mt-1 text-xs text-slate-500">{group.description}</p></div>
              <div className="space-y-5">
                {group.questions.map((question) => (
                  <div key={question.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="mb-3 flex items-center justify-between gap-2"><span className="text-xs font-bold text-teal-700">{question.id}</span><span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">{question.tag}</span></div>
                    <p className="mb-3 text-sm font-semibold leading-relaxed text-slate-800">{question.text}</p>
                    <div className="space-y-2">
                      {question.options.map((option, index) => {
                        const score = index + 1;
                        const selected = answers[question.id] === score;
                        return <button key={score} type="button" onClick={() => { setAnswers((old) => ({ ...old, [question.id]: score })); setError(""); }} aria-pressed={selected} className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition ${selected ? "border-teal-600 bg-teal-50 text-teal-800" : "border-slate-200 text-slate-700 hover:border-teal-300 hover:bg-slate-50"}`}>
                          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${selected ? "border-teal-600 bg-teal-600 text-white" : "border-slate-300 bg-white"}`}>{score}</span><span className="flex-1">{option}</span>{selected && <CheckCircle2 className="h-5 w-5 text-teal-600" />}
                        </button>;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
          {error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <button type="submit" disabled={saving || answeredCount !== 10} className="w-full rounded-xl bg-teal-600 py-3 text-sm font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300">{saving ? "Đang gửi khảo sát..." : `Gửi khảo sát (${answeredCount}/10)`}</button>
          <p className="text-center text-xs text-slate-500">Mỗi người dùng chỉ gửi một khảo sát cho mỗi chuyến đi.</p>
        </form>
      </div>
    </div>
  );
}
