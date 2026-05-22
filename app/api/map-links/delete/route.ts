import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.linkId || !body?.memberId) {
    return NextResponse.json({ message: "삭제할 지도 링크 정보가 부족해요." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: link, error: linkError } = await supabase
    .from("day_map_links")
    .select("id,day_id")
    .eq("id", body.linkId)
    .single();

  if (linkError) {
    return NextResponse.json({ message: linkError.message }, { status: 500 });
  }

  const { error: deleteError } = await supabase.from("day_map_links").delete().eq("id", body.linkId);
  if (deleteError) {
    return NextResponse.json({ message: deleteError.message }, { status: 500 });
  }

  const { data: remainingLinks, error: remainingError } = await supabase
    .from("day_map_links")
    .select("id")
    .eq("day_id", link.day_id)
    .order("sort_order");

  if (remainingError) {
    return NextResponse.json({ message: remainingError.message }, { status: 500 });
  }

  try {
    await reorderLinks(link.day_id, remainingLinks?.map((remainingLink) => remainingLink.id) ?? []);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "지도 링크 정리에 실패했어요." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

async function reorderLinks(dayId: string, orderedIds: string[]) {
  const supabase = getSupabaseAdmin();

  for (const [index, id] of orderedIds.entries()) {
    const { error } = await supabase
      .from("day_map_links")
      .update({ sort_order: -1000 - index })
      .eq("day_id", dayId)
      .eq("id", id);
    if (error) throw error;
  }

  for (const [index, id] of orderedIds.entries()) {
    const { error } = await supabase
      .from("day_map_links")
      .update({ sort_order: index + 1 })
      .eq("day_id", dayId)
      .eq("id", id);
    if (error) throw error;
  }
}
