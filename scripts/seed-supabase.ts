import { createClient } from "@supabase/supabase-js";
import { itineraryItems, mapLinks, members, trip, tripDays } from "../src/data/baseData";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

async function seed() {
  await upsert("trips", [
    {
      id: trip.id,
      title: trip.title,
      start_date: trip.startDate,
      end_date: trip.endDate,
      cities: trip.cities
    }
  ]);

  await upsert(
    "members",
    members.map((member) => ({
      id: member.id,
      name: member.name,
      username: member.username,
      color_name: member.colorName,
      color: member.color,
      background_color: member.backgroundColor,
      role: member.role
    }))
  );

  await upsert(
    "trip_days",
    tripDays.map((day) => ({
      id: day.id,
      trip_id: day.tripId,
      day_number: day.dayNumber,
      date: day.date,
      weekday: day.weekday,
      title: day.title,
      city: day.city,
      summary: day.summary,
      lodging: day.lodging,
      lodging_address: day.lodgingAddress,
      lodging_map_url: day.lodgingMapUrl,
      goal: day.goal,
      caution: day.caution
    }))
  );

  await upsert(
    "itinerary_items",
    itineraryItems.map((planItem) => ({
      id: planItem.id,
      trip_id: planItem.tripId,
      day_id: planItem.dayId,
      sort_order: planItem.sortOrder,
      time_label: planItem.timeLabel,
      title: planItem.title,
      item_type: planItem.itemType,
      city: planItem.city,
      place_name: planItem.placeName,
      address: planItem.address,
      map_url: planItem.mapUrl,
      description: planItem.description,
      importance: planItem.importance,
      created_by_member_id: planItem.createdByMemberId
    }))
  );

  await upsert(
    "day_map_links",
    mapLinks.map((mapLink) => ({
      id: mapLink.id,
      day_id: mapLink.dayId,
      sort_order: mapLink.sortOrder,
      place_name: mapLink.placeName,
      address: mapLink.address,
      purpose: mapLink.purpose,
      map_url: mapLink.mapUrl
    }))
  );

  const { data: openRound, error: roundError } = await supabase
    .from("settlement_rounds")
    .select("id")
    .eq("trip_id", trip.id)
    .eq("status", "open")
    .maybeSingle();

  if (roundError) {
    throw roundError;
  }

  if (!openRound) {
    const { error } = await supabase.from("settlement_rounds").insert({ trip_id: trip.id });
    if (error) {
      throw error;
    }
  }

  console.log("Supabase seed complete.");
}

async function upsert(table: string, rows: Record<string, unknown>[]) {
  const { error } = await supabase.from(table).upsert(rows, { onConflict: "id" });
  if (error) {
    throw error;
  }
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
