import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { trip } from "@/data/baseData";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

const itemTypes = new Set(["place", "note"]);
const optionalInsertColumns = new Set(["address", "created_by_member_id", "item_type"]);

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body?.dayId || !body?.memberId || !body?.title || !itemTypes.has(body.itemType)) {
    return NextResponse.json({ message: "추가할 일정 정보가 부족해요." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: day, error: dayError } = await supabase
    .from("trip_days")
    .select("id,trip_id,city")
    .eq("id", body.dayId)
    .single();

  if (dayError) {
    return NextResponse.json({ message: dayError.message }, { status: 500 });
  }

  const { data: currentItems, error: itemsError } = await supabase
    .from("itinerary_items")
    .select("id")
    .eq("day_id", body.dayId)
    .order("sort_order");

  if (itemsError) {
    return NextResponse.json({ message: itemsError.message }, { status: 500 });
  }

  const itemId = `item-user-${randomUUID()}`;
  const temporarySortOrder = -100000 - Math.floor(Math.random() * 100000);
  const itemType = body.itemType === "note" ? "note" : "place";
  const title = String(body.title).trim();
  const placeName = itemType === "note" ? "" : String(body.placeName ?? body.title).trim();
  const address = itemType === "note" ? "" : String(body.address ?? "").trim();
  const mapUrl = itemType === "note" ? "" : String(body.mapUrl ?? "").trim();

  let insertPayload: Record<string, string | number> = {
    id: itemId,
    trip_id: day.trip_id ?? trip.id,
    day_id: body.dayId,
    sort_order: temporarySortOrder,
    time_label: String(body.timeLabel ?? "").trim() || (itemType === "note" ? "노트" : "추가"),
    title,
    item_type: itemType,
    city: String(body.city ?? day.city ?? "").trim(),
    place_name: placeName,
    address,
    map_url: mapUrl,
    description: String(body.description ?? "").trim(),
    importance: "normal",
    created_by_member_id: String(body.memberId)
  };

  let insertError: { message: string } | null = null;

  for (let attempt = 0; attempt < optionalInsertColumns.size + 1; attempt += 1) {
    const { error } = await supabase.from("itinerary_items").insert(insertPayload);

    if (!error) {
      insertError = null;
      break;
    }

    const missingColumn = getMissingColumnName(error);
    if (!missingColumn || !optionalInsertColumns.has(missingColumn) || !(missingColumn in insertPayload)) {
      insertError = error;
      break;
    }

    const { [missingColumn]: _removed, ...nextPayload } = insertPayload;
    insertPayload = nextPayload;
    insertError = error;
  }

  if (insertError) {
    return NextResponse.json({ message: insertError.message }, { status: 500 });
  }

  const orderedIds = insertAfter(currentItems?.map((item) => item.id) ?? [], itemId, body.afterItemId ?? null);

  try {
    await reorderItems(body.dayId, orderedIds);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "일정 순서 정리에 실패했어요." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, itemId });
}

function getMissingColumnName(error: unknown) {
  if (!error || typeof error !== "object") return null;

  const maybeError = error as { code?: unknown; message?: unknown };
  const message = typeof maybeError.message === "string" ? maybeError.message : "";

  if (maybeError.code !== "PGRST204" && !message.includes("schema cache")) {
    return null;
  }

  return message.match(/'([^']+)' column/)?.[1] ?? null;
}

function insertAfter(currentIds: string[], itemId: string, afterItemId: string | null) {
  if (!afterItemId) {
    return [...currentIds, itemId];
  }

  const index = currentIds.indexOf(afterItemId);
  if (index < 0) {
    return [...currentIds, itemId];
  }

  const nextIds = [...currentIds];
  nextIds.splice(index + 1, 0, itemId);
  return nextIds;
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
