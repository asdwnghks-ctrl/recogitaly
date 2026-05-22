import { itineraryItems, mapLinks, members, trip, tripDays } from "@/data/baseData";
import { getBrowserSupabase } from "@/lib/supabaseClient";
import { normalizeExpenseAmount } from "@/lib/settlement";
import type {
  AppData,
  Currency,
  Expense,
  ExpenseCategory,
  ExpenseType,
  PlaceCandidate,
  PlaceCategory,
  PlaceComment,
  PlaceRecommendation,
  PlaceStatus,
  SettlementConfirmation,
  SettlementRound,
  SupabaseStatus
} from "@/lib/types";

const emptyDynamicData = {
  candidates: [],
  recommendations: [],
  comments: [],
  visitChecks: [],
  expenses: [],
  settlementRounds: [],
  settlementConfirmations: []
};

export const fallbackData: AppData = {
  trip,
  members,
  days: tripDays,
  itineraryItems,
  mapLinks,
  ...emptyDynamicData
};

export type LoadResult = {
  data: AppData;
  status: SupabaseStatus;
  errorMessage: string;
};

export async function loadAppData(): Promise<LoadResult> {
  const supabase = getBrowserSupabase();

  if (!supabase) {
    return { data: fallbackData, status: "not-configured", errorMessage: "" };
  }

  try {
    const [
      tripResult,
      membersResult,
      daysResult,
      itemsResult,
      mapLinksResult
    ] = await Promise.all([
      supabase.from("trips").select("*").eq("id", trip.id).maybeSingle(),
      supabase.from("members").select("*").order("created_at"),
      supabase.from("trip_days").select("*").order("day_number"),
      supabase.from("itinerary_items").select("*").order("day_id").order("sort_order"),
      supabase.from("day_map_links").select("*").order("day_id").order("sort_order")
    ]);

    const baseError = [
      tripResult.error,
      membersResult.error,
      daysResult.error,
      itemsResult.error,
      mapLinksResult.error
    ].find(Boolean);

    if (baseError) {
      throw baseError;
    }

    const [
      candidatesResult,
      recommendationsResult,
      commentsResult,
      visitsResult,
      expensesResult,
      roundsResult,
      confirmationsResult
    ] = await Promise.all([
      safeQuery(supabase.from("place_candidates").select("*").order("created_at", { ascending: false })),
      safeQuery(supabase.from("place_recommendations").select("*").order("created_at")),
      safeQuery(supabase.from("place_comments").select("*").order("created_at")),
      safeQuery(supabase.from("visit_checks").select("*").order("visited_at", { ascending: false })),
      safeQuery(supabase.from("expenses").select("*").order("created_at", { ascending: false })),
      safeQuery(supabase.from("settlement_rounds").select("*").order("opened_at", { ascending: false })),
      safeQuery(supabase.from("settlement_confirmations").select("*").order("confirmed_at"))
    ]);

    return {
      status: "connected",
      errorMessage: "",
      data: {
        trip: tripResult.data ? mapTrip(tripResult.data) : trip,
        members: membersResult.data?.length ? membersResult.data.map(mapMember) : members,
        days: daysResult.data?.length ? daysResult.data.map(mapDay) : tripDays,
        itineraryItems: itemsResult.data?.length ? itemsResult.data.map(mapItineraryItem) : itineraryItems,
        mapLinks: mapLinksResult.data?.length ? mapLinksResult.data.map(mapMapLink) : mapLinks,
        candidates: candidatesResult.data?.map(mapCandidate) ?? [],
        recommendations: recommendationsResult.data?.map(mapRecommendation) ?? [],
        comments: commentsResult.data?.map(mapComment) ?? [],
        visitChecks: visitsResult.data?.map((row) => ({
          id: row.id,
          placeId: row.place_id,
          memberIds: row.member_ids ?? [],
          checkedByMemberId: row.checked_by_member_id,
          note: row.note ?? "",
          visitedAt: row.visited_at
        })) ?? [],
        expenses: expensesResult.data?.map(mapExpense) ?? [],
        settlementRounds: roundsResult.data?.map(mapRound) ?? [],
        settlementConfirmations: confirmationsResult.data?.map(mapConfirmation) ?? []
      }
    };
  } catch (error) {
    return {
      data: fallbackData,
      status: "error",
      errorMessage: describeError(error)
    };
  }
}

async function safeQuery(query: PromiseLike<{ data: any[] | null; error: any }>) {
  try {
    const result = await query;
    if (result.error) {
      return { data: [], error: result.error };
    }
    return result;
  } catch (error) {
    return { data: [], error };
  }
}

export async function addCandidate(input: {
  name: string;
  city: string;
  category: PlaceCategory;
  mapUrl: string;
  reason: string;
  memberId: string;
  dayId: string;
  afterItemId: string | null;
  beforeItemId: string | null;
}) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("place_candidates")
    .insert({
      trip_id: trip.id,
      name: input.name,
      city: input.city,
      category: input.category,
      map_url: input.mapUrl,
      reason: input.reason,
      suggested_by_member_id: input.memberId,
      related_day_id: input.dayId,
      related_itinerary_item_id: input.afterItemId,
      after_itinerary_item_id: input.afterItemId,
      before_itinerary_item_id: input.beforeItemId,
      status: "suggested"
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapCandidate(data);
}

export async function toggleRecommendation(placeId: string, memberId: string, active: boolean) {
  const supabase = requireSupabase();

  if (active) {
    const { error } = await supabase
      .from("place_recommendations")
      .delete()
      .eq("place_id", placeId)
      .eq("member_id", memberId);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("place_recommendations").insert({ place_id: placeId, member_id: memberId });
  if (error) throw error;
}

export async function addComment(placeId: string, memberId: string, body: string) {
  const supabase = requireSupabase();
  const { error } = await supabase.from("place_comments").insert({ place_id: placeId, member_id: memberId, body });
  if (error) throw error;
}

export async function addExpense(input: {
  type: ExpenseType;
  title: string;
  amount: number;
  currency: Currency;
  paidByMemberId: string;
  spentForMemberId: string | null;
  date: string;
  category: ExpenseCategory;
  note: string;
  settlementRoundId: string | null;
  memberIds: string[];
}) {
  const supabase = requireSupabase();
  const normalized = normalizeExpenseAmount(input.amount, input.currency);
  let settlementRoundId = input.settlementRoundId;

  if (input.type === "shared" && !settlementRoundId) {
    const { data: round, error: roundError } = await supabase
      .from("settlement_rounds")
      .insert({ trip_id: trip.id })
      .select("id")
      .single();

    if (roundError) throw roundError;
    settlementRoundId = round.id;
  }

  const { error } = await supabase.from("expenses").insert({
    trip_id: trip.id,
    settlement_round_id: input.type === "shared" ? settlementRoundId : null,
    type: input.type,
    title: input.title,
    amount: input.amount,
    currency: input.currency,
    exchange_rate_to_krw: normalized.exchangeRateToKrw,
    amount_krw: normalized.amountKrw,
    amount_eur: normalized.amountEur,
    paid_by_member_id: input.paidByMemberId,
    spent_for_member_id: input.type === "personal" ? input.spentForMemberId : null,
    participant_member_ids: input.type === "shared" ? input.memberIds : [input.paidByMemberId],
    date: input.date,
    category: input.category,
    note: input.note
  });

  if (error) throw error;
}

export async function deleteExpense(expenseId: string, memberId: string) {
  await postJson("/api/expenses/delete", { expenseId, memberId }, "비용 삭제에 실패했어요.");
}

export async function deleteCandidate(placeId: string, memberId: string) {
  await postJson("/api/places/delete", { placeId, memberId }, "장소 삭제에 실패했어요.");
}

export async function deleteMapLink(linkId: string, memberId: string) {
  await postJson("/api/map-links/delete", { linkId, memberId }, "지도 링크 삭제에 실패했어요.");
}

export async function reorderMapLinks(dayId: string, orderedIds: string[], memberId: string) {
  await postJson("/api/map-links/reorder", { dayId, orderedIds, memberId }, "지도 링크 순서 변경에 실패했어요.");
}

export async function confirmSettlement(roundId: string, memberId: string) {
  const supabase = requireSupabase();
  const { error } = await supabase
    .from("settlement_confirmations")
    .upsert({ settlement_round_id: roundId, member_id: memberId }, { onConflict: "settlement_round_id,member_id" });
  if (error) throw error;

  await fetch("/api/settlement/close", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roundId })
  });
}

async function postJson(url: string, body: unknown, fallbackMessage: string) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const responseBody = await response.json().catch(() => null);
    throw new Error(responseBody?.message ?? fallbackMessage);
  }
}

export async function verifyAdminCode(code: string) {
  const response = await fetch("/api/admin/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code })
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? "관리자 코드가 맞지 않아요.");
  }
}

export async function decidePlace(placeId: string, status: Extract<PlaceStatus, "approved" | "pending" | "rejected">, note: string, memberId: string) {
  const response = await fetch("/api/admin/place-decision", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ placeId, status, note, memberId })
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? "승인 처리를 하지 못했어요.");
  }
}

export async function markVisited(placeId: string, memberIds: string[], checkedByMemberId: string, note: string) {
  const response = await fetch("/api/admin/visit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ placeId, memberIds, checkedByMemberId, note })
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? "방문 완료 처리에 실패했어요.");
  }
}

function requireSupabase() {
  const supabase = getBrowserSupabase();
  if (!supabase) {
    throw new Error("Supabase 환경변수가 아직 연결되지 않았어요.");
  }
  return supabase;
}

function describeError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const maybeError = error as { message?: unknown; code?: unknown };
    const code = typeof maybeError.code === "string" ? `${maybeError.code}: ` : "";
    if (typeof maybeError.message === "string") {
      return `${code}${maybeError.message}`;
    }
  }

  return "Supabase 데이터를 불러오지 못했어요.";
}

function mapTrip(row: any) {
  return { id: row.id, title: row.title, startDate: row.start_date, endDate: row.end_date, cities: row.cities ?? [] };
}

function mapMember(row: any) {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    colorName: row.color_name,
    color: row.color,
    backgroundColor: row.background_color,
    role: row.role
  };
}

function mapDay(row: any) {
  return {
    id: row.id,
    tripId: row.trip_id,
    dayNumber: row.day_number,
    date: row.date,
    weekday: row.weekday,
    title: row.title,
    city: row.city,
    summary: row.summary,
    lodging: row.lodging ?? "",
    goal: row.goal ?? "",
    caution: row.caution ?? ""
  };
}

function mapItineraryItem(row: any) {
  return {
    id: row.id,
    tripId: row.trip_id,
    dayId: row.day_id,
    sortOrder: row.sort_order,
    timeLabel: row.time_label,
    title: row.title,
    city: row.city ?? "",
    placeName: row.place_name ?? "",
    mapUrl: row.map_url ?? "",
    description: row.description ?? "",
    importance: row.importance
  };
}

function mapMapLink(row: any) {
  return {
    id: row.id,
    dayId: row.day_id,
    sortOrder: row.sort_order,
    placeName: row.place_name,
    purpose: row.purpose,
    mapUrl: row.map_url
  };
}

function mapCandidate(row: any): PlaceCandidate {
  return {
    id: row.id,
    tripId: row.trip_id,
    name: row.name,
    city: row.city,
    category: row.category,
    mapUrl: row.map_url,
    suggestedByMemberId: row.suggested_by_member_id,
    relatedDayId: row.related_day_id,
    relatedItineraryItemId: row.related_itinerary_item_id,
    afterItineraryItemId: row.after_itinerary_item_id,
    beforeItineraryItemId: row.before_itinerary_item_id,
    reason: row.reason ?? "",
    status: row.status,
    adminNote: row.admin_note ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapRecommendation(row: any): PlaceRecommendation {
  return { id: row.id, placeId: row.place_id, memberId: row.member_id, createdAt: row.created_at };
}

function mapComment(row: any): PlaceComment {
  return { id: row.id, placeId: row.place_id, memberId: row.member_id, body: row.body, createdAt: row.created_at };
}

function mapExpense(row: any): Expense {
  return {
    id: row.id,
    tripId: row.trip_id,
    settlementRoundId: row.settlement_round_id,
    type: row.type,
    title: row.title,
    amount: Number(row.amount),
    currency: row.currency,
    exchangeRateToKrw: Number(row.exchange_rate_to_krw),
    amountKrw: Number(row.amount_krw),
    amountEur: Number(row.amount_eur),
    paidByMemberId: row.paid_by_member_id,
    spentForMemberId: row.spent_for_member_id,
    participantMemberIds: row.participant_member_ids ?? [],
    date: row.date,
    category: row.category,
    note: row.note ?? "",
    createdAt: row.created_at
  };
}

function mapRound(row: any): SettlementRound {
  return { id: row.id, tripId: row.trip_id, status: row.status, openedAt: row.opened_at, closedAt: row.closed_at };
}

function mapConfirmation(row: any): SettlementConfirmation {
  return {
    id: row.id,
    settlementRoundId: row.settlement_round_id,
    memberId: row.member_id,
    confirmedAt: row.confirmed_at
  };
}
