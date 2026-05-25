import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, isAdminToken } from "@/lib/adminSession";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body?.itemId || !body?.memberId) {
    return NextResponse.json({ message: "삭제할 일정 정보가 부족해요." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const itemResult = await fetchItineraryItem(String(body.itemId));

  if (itemResult.error) {
    return NextResponse.json({ message: itemResult.error.message }, { status: 500 });
  }

  const item = itemResult.data;
  if (!item) {
    return NextResponse.json({ message: "삭제할 일정을 찾지 못했어요." }, { status: 404 });
  }

  const cookieStore = await cookies();
  const canUseAdmin = isAdminToken(cookieStore.get(ADMIN_COOKIE)?.value);
  const canDelete =
    item.id.startsWith("item-user-") &&
    (!item.created_by_member_id || item.created_by_member_id === body.memberId || canUseAdmin);

  if (!canDelete) {
    return NextResponse.json({ message: "직접 추가한 일정만 삭제할 수 있어요." }, { status: 403 });
  }

  const { error: deleteError } = await supabase.from("itinerary_items").delete().eq("id", item.id);
  if (deleteError) {
    return NextResponse.json({ message: deleteError.message }, { status: 500 });
  }

  const { data: remainingItems, error: remainingError } = await supabase
    .from("itinerary_items")
    .select("id")
    .eq("day_id", item.day_id)
    .order("sort_order");

  if (remainingError) {
    return NextResponse.json({ message: remainingError.message }, { status: 500 });
  }

  try {
    await reorderItems(item.day_id, remainingItems?.map((remainingItem) => remainingItem.id) ?? []);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "일정 순서 정리에 실패했어요." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

async function fetchItineraryItem(itemId: string): Promise<{
  data: { id: string; day_id: string; created_by_member_id?: string | null } | null;
  error: { message: string } | null;
}> {
  const supabase = getSupabaseAdmin();
  const result = await supabase
    .from("itinerary_items")
    .select("id,day_id,created_by_member_id")
    .eq("id", itemId)
    .maybeSingle();

  if (!isMissingColumnError(result.error, "created_by_member_id")) {
    return result;
  }

  return supabase.from("itinerary_items").select("id,day_id").eq("id", itemId).maybeSingle();
}

function isMissingColumnError(error: unknown, columnName: string) {
  if (!error || typeof error !== "object") return false;

  const maybeError = error as { code?: unknown; message?: unknown };
  const message = typeof maybeError.message === "string" ? maybeError.message : "";
  return (
    (message.includes(`'${columnName}' column`) || message.includes(`${columnName} does not exist`)) &&
    (maybeError.code === "PGRST204" || maybeError.code === "42703" || message.includes("schema cache") || message.includes("does not exist"))
  );
}

async function reorderItems(dayId: string, orderedIds: string[]) {
  const supabase = getSupabaseAdmin();

  for (const [index, id] of orderedIds.entries()) {
    const { error } = await supabase
      .from("itinerary_items")
      .update({ sort_order: -1000 - index })
      .eq("day_id", dayId)
      .eq("id", id);

    if (error) throw error;
  }

  for (const [index, id] of orderedIds.entries()) {
    const { error } = await supabase
      .from("itinerary_items")
      .update({ sort_order: index + 1 })
      .eq("day_id", dayId)
      .eq("id", id);

    if (error) throw error;
  }
}
