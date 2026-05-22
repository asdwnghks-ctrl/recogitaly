import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, isAdminToken } from "@/lib/adminSession";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (!isAdminToken(cookieStore.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ message: "관리자 권한이 필요해요." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.placeId || !body?.checkedByMemberId || !Array.isArray(body.memberIds)) {
    return NextResponse.json({ message: "방문 완료 정보가 부족해요." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { error: visitError } = await supabase.from("visit_checks").insert({
    place_id: body.placeId,
    member_ids: body.memberIds,
    checked_by_member_id: body.checkedByMemberId,
    note: body.note ?? ""
  });

  if (visitError) {
    return NextResponse.json({ message: visitError.message }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from("place_candidates")
    .update({ status: "visited" })
    .eq("id", body.placeId);

  if (updateError) {
    return NextResponse.json({ message: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
