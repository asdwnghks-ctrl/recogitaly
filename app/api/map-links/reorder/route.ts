import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const orderedIds = Array.isArray(body?.orderedIds) ? body.orderedIds.filter((id: unknown) => typeof id === "string") : [];

  if (!body?.dayId || !body?.memberId || orderedIds.length === 0) {
    return NextResponse.json({ message: "지도 링크 순서 정보가 부족해요." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: links, error: linksError } = await supabase
    .from("day_map_links")
    .select("id")
    .eq("day_id", body.dayId);

  if (linksError) {
    return NextResponse.json({ message: linksError.message }, { status: 500 });
  }

  const currentIds = new Set((links ?? []).map((link) => link.id));
  if (currentIds.size !== orderedIds.length || orderedIds.some((id: string) => !currentIds.has(id))) {
    return NextResponse.json({ message: "현재 지도 링크 목록과 순서 정보가 맞지 않아요." }, { status: 400 });
  }

  for (const [index, id] of orderedIds.entries()) {
    const { error } = await supabase
      .from("day_map_links")
      .update({ sort_order: -1000 - index })
      .eq("day_id", body.dayId)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
  }

  for (const [index, id] of orderedIds.entries()) {
    const { error } = await supabase
      .from("day_map_links")
      .update({ sort_order: index + 1 })
      .eq("day_id", body.dayId)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
