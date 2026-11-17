import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { POIRepository } from "@/lib/db/repositories";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user || user.role !== "MANAGER") {
    return NextResponse.json({ error: "Manager access required" }, { status: 403 });
  }
  const body = await req.json();
  const poi = await POIRepository.update(params.id, {
    ...body,
    lat: body.lat !== undefined ? Number(body.lat) : undefined,
    lng: body.lng !== undefined ? Number(body.lng) : undefined,
    estimatedCostVnd: body.estimatedCostVnd !== undefined ? Number(body.estimatedCostVnd) : undefined,
    avgDurationMins: body.avgDurationMins !== undefined ? Number(body.avgDurationMins) : undefined,
    tags: Array.isArray(body.tags)
      ? body.tags
      : typeof body.tags === "string"
      ? body.tags.split(",").map((s: string) => s.trim()).filter(Boolean)
      : undefined,
  });
  return NextResponse.json({ poi });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user || user.role !== "MANAGER") {
    return NextResponse.json({ error: "Manager access required" }, { status: 403 });
  }
  await POIRepository.delete(params.id);
  return NextResponse.json({ ok: true });
}