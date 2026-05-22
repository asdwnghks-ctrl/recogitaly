import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, isAdminToken } from "@/lib/adminSession";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.placeId || !body?.memberId) {
    return NextResponse.json({ message: "삭제할 장소 정보가 부족해요." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: place, error: placeError } = await supabase
    .from("place_candidates")
    .select("id,suggested_by_member_id")
    .eq("id", body.placeId)
    .single();

  if (placeError) {
    return NextResponse.json({ message: placeError.message }, { status: 500 });
  }

  const cookieStore = await cookies();
  const canDelete = place.suggested_by_member_id === body.memberId || isAdminToken(cookieStore.get(ADMIN_COOKIE)?.value);
  if (!canDelete) {
    return NextResponse.json({ message: "내가 올린 장소만 삭제할 수 있어요." }, { status: 403 });
  }

  const { error: deleteError } = await supabase.from("place_candidates").delete().eq("id", body.placeId);
  if (deleteError) {
    return NextResponse.json({ message: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
