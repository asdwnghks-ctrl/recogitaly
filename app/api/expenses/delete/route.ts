import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, isAdminToken } from "@/lib/adminSession";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.expenseId || !body?.memberId) {
    return NextResponse.json({ message: "삭제할 비용 정보가 부족해요." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: expense, error: expenseError } = await supabase
    .from("expenses")
    .select("id,type,settlement_round_id,paid_by_member_id")
    .eq("id", body.expenseId)
    .single();

  if (expenseError) {
    return NextResponse.json({ message: expenseError.message }, { status: 500 });
  }

  const cookieStore = await cookies();
  const canDelete = expense.paid_by_member_id === body.memberId || isAdminToken(cookieStore.get(ADMIN_COOKIE)?.value);
  if (!canDelete) {
    return NextResponse.json({ message: "내가 올린 비용만 삭제할 수 있어요." }, { status: 403 });
  }

  const { error: deleteError } = await supabase.from("expenses").delete().eq("id", body.expenseId);
  if (deleteError) {
    return NextResponse.json({ message: deleteError.message }, { status: 500 });
  }

  if (expense.type === "shared" && expense.settlement_round_id) {
    await supabase
      .from("settlement_confirmations")
      .delete()
      .eq("settlement_round_id", expense.settlement_round_id);
  }

  return NextResponse.json({ ok: true });
}
