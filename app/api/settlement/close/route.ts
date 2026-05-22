import { NextResponse } from "next/server";
import { trip } from "@/data/baseData";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  const { roundId } = await request.json().catch(() => ({ roundId: "" }));
  if (!roundId) {
    return NextResponse.json({ message: "정산 라운드가 필요해요." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const [{ data: memberRows, error: memberError }, { data: confirmations, error: confirmationError }] =
    await Promise.all([
      supabase.from("members").select("id"),
      supabase.from("settlement_confirmations").select("member_id").eq("settlement_round_id", roundId)
    ]);

  if (memberError || confirmationError) {
    return NextResponse.json({ message: memberError?.message ?? confirmationError?.message }, { status: 500 });
  }

  if ((confirmations?.length ?? 0) < (memberRows?.length ?? 0)) {
    return NextResponse.json({ ok: true, closed: false });
  }

  const { error: closeError } = await supabase
    .from("settlement_rounds")
    .update({ status: "closed", closed_at: new Date().toISOString() })
    .eq("id", roundId)
    .eq("status", "open");

  if (closeError) {
    return NextResponse.json({ message: closeError.message }, { status: 500 });
  }

  const { data: existingOpenRound, error: openRoundError } = await supabase
    .from("settlement_rounds")
    .select("id")
    .eq("trip_id", trip.id)
    .eq("status", "open")
    .maybeSingle();

  if (openRoundError) {
    return NextResponse.json({ message: openRoundError.message }, { status: 500 });
  }

  if (!existingOpenRound) {
    const { error: insertError } = await supabase.from("settlement_rounds").insert({ trip_id: trip.id });
    if (insertError) {
      return NextResponse.json({ message: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, closed: true });
}
