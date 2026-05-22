import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, isAdminToken } from "@/lib/adminSession";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

const allowedStatuses = new Set(["approved", "pending", "rejected"]);

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (!isAdminToken(cookieStore.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ message: "관리자 권한이 필요해요." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.placeId || !allowedStatuses.has(body.status) || !body?.memberId) {
    return NextResponse.json({ message: "승인 처리 정보가 부족해요." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: place, error: placeError } = await supabase
    .from("place_candidates")
    .select("*")
    .eq("id", body.placeId)
    .single();

  if (placeError) {
    return NextResponse.json({ message: placeError.message }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from("place_candidates")
    .update({ status: body.status, admin_note: body.note ?? "" })
    .eq("id", body.placeId);

  if (updateError) {
    return NextResponse.json({ message: updateError.message }, { status: 500 });
  }

  const { error: approvalError } = await supabase.from("place_approvals").insert({
    place_id: body.placeId,
    decided_by_member_id: body.memberId,
    decision: body.status,
    related_day_id: place.related_day_id,
    related_itinerary_item_id: place.related_itinerary_item_id,
    approved_after_itinerary_item_id: place.after_itinerary_item_id,
    approved_before_itinerary_item_id: place.before_itinerary_item_id,
    note: body.note ?? ""
  });

  if (approvalError) {
    return NextResponse.json({ message: approvalError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
