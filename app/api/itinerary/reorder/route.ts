import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const orderedIds = Array.isArray(body?.orderedIds) ? body.orderedIds.filter((id: unknown) => typeof id === "string") : [];

  if (!body?.dayId || !body?.memberId || orderedIds.length === 0) {
    return NextResponse.json({ message: "일정 순서 정보가 부족해요." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: items, error: itemsError } = await supabase
    .from("itinerary_items")
    .select("id")
    .eq("day_id", body.dayId);

  if (itemsError) {
    return NextResponse.json({ message: itemsError.message }, { status: 500 });
  }

  const currentIds = new Set((items ?? []).map((item) => item.id));
  if (currentIds.size !== orderedIds.length || orderedIds.some((id: string) => !currentIds.has(id))) {
    return NextResponse.json({ message: "현재 일정 목록과 순서 정보가 맞지 않아요." }, { status: 400 });
  }

  for (const [index, id] of orderedIds.entries()) {
    const { error } = await supabase
      .from("itinerary_items")
      .update({ sort_order: -1000 - index })
      .eq("day_id", body.dayId)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
  }

  for (const [index, id] of orderedIds.entries()) {
    const { error } = await supabase
      .from("itinerary_items")
      .update({ sort_order: index + 1 })
      .eq("day_id", body.dayId)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
