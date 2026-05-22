export type MemberRole = "admin" | "member";

export type Member = {
  id: string;
  name: string;
  username: string;
  colorName: string;
  color: string;
  backgroundColor: string;
  role: MemberRole;
};

export type Trip = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  cities: string[];
};

export type Importance = "high" | "normal" | "low";

export type TripDay = {
  id: string;
  tripId: string;
  dayNumber: number;
  date: string;
  weekday: string;
  title: string;
  city: string;
  summary: string;
  lodging: string;
  goal: string;
  caution: string;
};

export type ItineraryItem = {
  id: string;
  tripId: string;
  dayId: string;
  sortOrder: number;
  timeLabel: string;
  title: string;
  city: string;
  placeName: string;
  mapUrl: string;
  description: string;
  importance: Importance;
};

export type DayMapLink = {
  id: string;
  dayId: string;
  sortOrder: number;
  placeName: string;
  purpose: string;
  mapUrl: string;
};

export type PlaceCategory =
  | "food"
  | "cafe"
  | "dessert"
  | "bar"
  | "grocery"
  | "sight"
  | "shopping"
  | "etc";

export type PlaceStatus = "suggested" | "approved" | "pending" | "rejected" | "visited";

export type PlaceCandidate = {
  id: string;
  tripId: string;
  name: string;
  city: string;
  category: PlaceCategory;
  mapUrl: string;
  suggestedByMemberId: string;
  relatedDayId: string;
  relatedItineraryItemId: string | null;
  afterItineraryItemId: string | null;
  beforeItineraryItemId: string | null;
  reason: string;
  status: PlaceStatus;
  adminNote: string;
  createdAt: string;
  updatedAt: string;
};

export type PlaceRecommendation = {
  id: string;
  placeId: string;
  memberId: string;
  createdAt: string;
};

export type PlaceComment = {
  id: string;
  placeId: string;
  memberId: string;
  body: string;
  createdAt: string;
};

export type VisitCheck = {
  id: string;
  placeId: string;
  memberIds: string[];
  checkedByMemberId: string;
  note: string;
  visitedAt: string;
};

export type ExpenseType = "personal" | "shared";
export type Currency = "EUR" | "KRW";

export type ExpenseCategory =
  | "food"
  | "cafe"
  | "grocery"
  | "transport"
  | "lodging"
  | "ticket"
  | "shopping"
  | "etc";

export type Expense = {
  id: string;
  tripId: string;
  settlementRoundId: string | null;
  type: ExpenseType;
  title: string;
  amount: number;
  currency: Currency;
  exchangeRateToKrw: number;
  amountKrw: number;
  amountEur: number;
  paidByMemberId: string;
  spentForMemberId: string | null;
  participantMemberIds: string[];
  date: string;
  category: ExpenseCategory;
  note: string;
  createdAt: string;
};

export type SettlementRound = {
  id: string;
  tripId: string;
  status: "open" | "closed";
  openedAt: string;
  closedAt: string | null;
};

export type SettlementConfirmation = {
  id: string;
  settlementRoundId: string;
  memberId: string;
  confirmedAt: string;
};

export type AppData = {
  trip: Trip;
  members: Member[];
  days: TripDay[];
  itineraryItems: ItineraryItem[];
  mapLinks: DayMapLink[];
  candidates: PlaceCandidate[];
  recommendations: PlaceRecommendation[];
  comments: PlaceComment[];
  visitChecks: VisitCheck[];
  expenses: Expense[];
  settlementRounds: SettlementRound[];
  settlementConfirmations: SettlementConfirmation[];
};

export type SupabaseStatus = "not-configured" | "connected" | "error";
