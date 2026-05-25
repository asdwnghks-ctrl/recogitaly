"use client";

import {
  ArrowDown,
  ArrowUp,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Copy,
  ExternalLink,
  GripVertical,
  Heart,
  Home,
  ImagePlus,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  StickyNote,
  Trash2,
  UserRound,
  WalletCards
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, PointerEvent as ReactPointerEvent } from "react";
import {
  addCandidate,
  addComment,
  addExpense,
  addItineraryItem,
  confirmSettlement,
  deleteCandidate,
  deleteExpense,
  deleteItineraryItem,
  deleteMapLink,
  decidePlace,
  fallbackData,
  loadAppData,
  markVisited,
  reorderItineraryItems,
  reorderMapLinks,
  toggleRecommendation,
  uploadCandidatePhoto,
  uploadItineraryPhoto,
  verifyAdminCode
} from "@/lib/appStore";
import { calculateSettlement, getExchangeRate, getOpenRound } from "@/lib/settlement";
import type {
  AppData,
  Currency,
  ExpenseCategory,
  ExpenseType,
  ItineraryItemPhoto,
  ItineraryItemType,
  ItineraryItem,
  Member,
  PlaceCandidate,
  PlaceCandidatePhoto,
  PlaceCategory,
  PlaceStatus,
  SupabaseStatus,
  TripDay
} from "@/lib/types";

type TabId = "home" | "schedule" | "accounting" | "more";
type DropPosition = "before" | "after";
type LodgingPoint = {
  name: string;
  address: string;
  mapUrl: string;
};
type PointerDragState = {
  itemId: string;
  pointerId: number;
  targetItemId: string | null;
  position: DropPosition | null;
};

const tabs: Array<{ id: TabId; label: string; icon: typeof Home }> = [
  { id: "home", label: "홈", icon: Home },
  { id: "schedule", label: "일정", icon: CalendarDays },
  { id: "accounting", label: "회계", icon: WalletCards },
  { id: "more", label: "더보기", icon: MoreHorizontal }
];

const categoryOptions: Array<{ value: PlaceCategory; label: string }> = [
  { value: "food", label: "식당" },
  { value: "cafe", label: "카페" },
  { value: "dessert", label: "디저트" },
  { value: "bar", label: "바" },
  { value: "grocery", label: "장보기" },
  { value: "sight", label: "관광" },
  { value: "shopping", label: "쇼핑" },
  { value: "etc", label: "기타" }
];

const expenseCategoryOptions: Array<{ value: ExpenseCategory; label: string }> = [
  { value: "food", label: "식사" },
  { value: "cafe", label: "카페" },
  { value: "grocery", label: "장보기" },
  { value: "transport", label: "교통" },
  { value: "lodging", label: "숙소" },
  { value: "ticket", label: "티켓" },
  { value: "shopping", label: "쇼핑" },
  { value: "etc", label: "기타" }
];

const statusLabels: Record<PlaceStatus, string> = {
  suggested: "제안됨",
  approved: "승인됨",
  pending: "보류",
  rejected: "거절",
  visited: "방문 완료"
};

const statusTone: Record<PlaceStatus, string> = {
  suggested: "badge badge-blue",
  approved: "badge badge-green",
  pending: "badge badge-amber",
  rejected: "badge badge-muted",
  visited: "badge badge-rose"
};

const memberStorageKey = "recogitaly-member-id";
const adminStorageKey = "recogitaly-admin-unlocked";

export function TripApp() {
  const [data, setData] = useState<AppData>(fallbackData);
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseStatus>("checking");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [selectedDayId, setSelectedDayId] = useState("day-01");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  const refresh = useCallback(async () => {
    const result = await loadAppData();
    setData(result.data);
    setSupabaseStatus(result.status);
    setErrorMessage(result.errorMessage);
  }, []);

  useEffect(() => {
    refresh();
    setSelectedMemberId(localStorage.getItem(memberStorageKey) ?? "");
    setAdminUnlocked(localStorage.getItem(adminStorageKey) === "true");
  }, [refresh]);

  useEffect(() => {
    if (toast) {
      const timer = window.setTimeout(() => setToast(""), 2400);
      return () => window.clearTimeout(timer);
    }
  }, [toast]);

  const currentMember = data.members.find((member) => member.id === selectedMemberId) ?? null;
  const canUseAdmin = Boolean(currentMember?.role === "admin" && adminUnlocked);
  const activeDay = useMemo(() => getNearestDay(data.days), [data.days]);
  const selectedDay = data.days.find((day) => day.id === selectedDayId) ?? activeDay ?? data.days[0];

  useEffect(() => {
    if (activeDay && selectedDayId === "day-01") {
      setSelectedDayId(activeDay.id);
    }
  }, [activeDay, selectedDayId]);

  const runAction = async (action: () => Promise<void>, successMessage: string) => {
    setBusy(true);
    try {
      await action();
      await refresh();
      setToast(successMessage);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "처리 중 문제가 생겼어요.");
    } finally {
      setBusy(false);
    }
  };

  if (!currentMember) {
    return (
      <AppShell
        data={data}
        status={supabaseStatus}
        errorMessage={errorMessage}
        currentMember={null}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        showNav={false}
      >
        <MemberGate
          members={data.members}
          onSelect={(member) => {
            localStorage.setItem(memberStorageKey, member.id);
            localStorage.removeItem(adminStorageKey);
            setSelectedMemberId(member.id);
            setAdminUnlocked(false);
          }}
        />
      </AppShell>
    );
  }

  if (currentMember.role === "admin" && !adminUnlocked) {
    return (
      <AppShell
        data={data}
        status={supabaseStatus}
        errorMessage={errorMessage}
        currentMember={currentMember}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        showNav={false}
      >
        <AdminGate
          member={currentMember}
          busy={busy}
          onVerify={(code) =>
            runAction(async () => {
              await verifyAdminCode(code);
              localStorage.setItem(adminStorageKey, "true");
              setAdminUnlocked(true);
            }, "관리자 모드로 들어왔어요.")
          }
          onChangeMember={() => {
            localStorage.removeItem(memberStorageKey);
            localStorage.removeItem(adminStorageKey);
            setSelectedMemberId("");
            setAdminUnlocked(false);
          }}
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      data={data}
      status={supabaseStatus}
      errorMessage={errorMessage}
      currentMember={currentMember}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      toast={toast}
    >
      {activeTab === "home" && (
        <HomeView
          data={data}
          day={activeDay ?? selectedDay}
          currentMember={currentMember}
          setActiveTab={setActiveTab}
          setSelectedDayId={setSelectedDayId}
        />
      )}
      {activeTab === "schedule" && (
        <ScheduleView
          data={data}
          selectedDay={selectedDay}
          currentMember={currentMember}
          canUseAdmin={canUseAdmin}
          busy={busy}
          setSelectedDayId={setSelectedDayId}
          runAction={runAction}
        />
      )}
      {activeTab === "accounting" && (
        <AccountingView data={data} currentMember={currentMember} busy={busy} runAction={runAction} />
      )}
      {activeTab === "more" && (
        <MoreView
          data={data}
          currentMember={currentMember}
          canUseAdmin={canUseAdmin}
          busy={busy}
          runAction={runAction}
          onRefresh={refresh}
          onChangeMember={() => {
            localStorage.removeItem(memberStorageKey);
            localStorage.removeItem(adminStorageKey);
            setSelectedMemberId("");
            setAdminUnlocked(false);
          }}
        />
      )}
    </AppShell>
  );
}

function AppShell({
  children,
  data,
  status,
  errorMessage,
  currentMember,
  activeTab,
  setActiveTab,
  toast,
  showNav = true
}: {
  children: React.ReactNode;
  data: AppData;
  status: SupabaseStatus;
  errorMessage: string;
  currentMember: Member | null;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  toast?: string;
  showNav?: boolean;
}) {
  return (
    <main className="app-shell">
      <header className="topbar">
        <LogoTitle />
        <div className="topbar-meta">
          <span>{data.trip.startDate.slice(5).replace("-", ".")} - {data.trip.endDate.slice(5).replace("-", ".")}</span>
          {currentMember && (
            <span className="member-pill" style={{ color: currentMember.color, backgroundColor: currentMember.backgroundColor }}>
              {currentMember.name}
            </span>
          )}
        </div>
      </header>

      <SupabaseBanner status={status} errorMessage={errorMessage} />

      <section className="screen">{children}</section>

      {toast && <div className="toast">{toast}</div>}

      {showNav && (
        <nav className="bottom-nav" aria-label="주요 화면">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                className={activeTab === tab.id ? "nav-button active" : "nav-button"}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={20} aria-hidden />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </main>
  );
}

function LogoTitle() {
  return (
    <h1 className="logo-title" aria-label="이탈리아 가아즈아">
      <span>이탈리아 가</span>
      <span className="split-syllable">
        <span className="point-blue">ㅇ</span>
        <span>ㅏ</span>
      </span>
      <span className="split-syllable">
        <span className="point-rose">ㅈ</span>
        <span>ㅡ</span>
      </span>
      <span>아</span>
    </h1>
  );
}

function SupabaseBanner({ status, errorMessage }: { status: SupabaseStatus; errorMessage: string }) {
  if (status === "checking") {
    return (
      <div className="sync-banner">
        <RefreshCw size={16} aria-hidden />
        Supabase 연결 확인 중
      </div>
    );
  }

  if (status === "connected") {
    return (
      <div className="sync-banner connected">
        <CheckCircle2 size={16} aria-hidden />
        Supabase 연결됨
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="sync-banner error">
        <ShieldCheck size={16} aria-hidden />
        Supabase 연결 확인 필요: {errorMessage}
      </div>
    );
  }

  return (
    <div className="sync-banner">
      <ShieldCheck size={16} aria-hidden />
      Supabase 환경변수 연결 전이라 기본 일정만 미리 보여줘요.
    </div>
  );
}

function MemberGate({ members, onSelect }: { members: Member[]; onSelect: (member: Member) => void }) {
  return (
    <div className="entry-panel">
      <div className="section-kicker">누구로 들어갈까요?</div>
      <h2>내 이름으로 기록 남기기</h2>
      <div className="member-grid">
        {members.map((member) => (
          <button
            key={member.id}
            type="button"
            className="member-card"
            onClick={() => onSelect(member)}
            style={{ borderColor: member.color }}
          >
            <span className="avatar" style={{ backgroundColor: member.backgroundColor, color: member.color }}>
              {member.name.slice(0, 1)}
            </span>
            <strong>{member.name}</strong>
            <span>{member.role === "admin" ? "관리자" : "멤버"}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function AdminGate({
  member,
  busy,
  onVerify,
  onChangeMember
}: {
  member: Member;
  busy: boolean;
  onVerify: (code: string) => void;
  onChangeMember: () => void;
}) {
  const [code, setCode] = useState("");

  return (
    <form
      className="entry-panel"
      onSubmit={(event) => {
        event.preventDefault();
        onVerify(code);
      }}
    >
      <div className="section-kicker">주환 확인</div>
      <h2>관리자 코드가 필요해요</h2>
      <label className="field">
        <span>접근 코드</span>
        <input value={code} onChange={(event) => setCode(event.target.value)} type="password" autoFocus />
      </label>
      <button className="primary-button" type="submit" disabled={busy || !code}>
        <ShieldCheck size={18} aria-hidden />
        관리자 모드
      </button>
      <button className="ghost-button" type="button" onClick={onChangeMember}>
        <UserRound size={18} aria-hidden />
        다른 이름으로 들어가기
      </button>
      <p className="muted-copy">{member.name}만 후보 승인과 방문 완료 처리를 할 수 있어요.</p>
    </form>
  );
}

function HomeView({
  data,
  day,
  currentMember,
  setActiveTab,
  setSelectedDayId
}: {
  data: AppData;
  day: TripDay;
  currentMember: Member;
  setActiveTab: (tab: TabId) => void;
  setSelectedDayId: (dayId: string) => void;
}) {
  const dayItems = data.itineraryItems.filter((item) => item.dayId === day.id).slice(0, 4);
  const approvedPlaces = data.candidates.filter(
    (candidate) => candidate.relatedDayId === day.id && ["approved", "visited"].includes(candidate.status)
  );
  const nextDay = data.days.find((candidateDay) => new Date(candidateDay.date) > new Date(day.date));

  return (
    <div className="stack">
      <section className="hero-band">
        <div>
          <div className="section-kicker">오늘도 가아즈아</div>
          <h2>{day.title}</h2>
          <p>{day.summary}</p>
        </div>
        <div className="day-chip-large">
          <strong>Day {day.dayNumber}</strong>
          <span>{day.date.slice(5).replace("-", ".")} {day.weekday}</span>
        </div>
      </section>

      <section className="quick-grid">
        <button type="button" onClick={() => { setSelectedDayId(day.id); setActiveTab("schedule"); }}>
          <CalendarDays size={20} aria-hidden />
          일정 보기
        </button>
        <button type="button" onClick={() => { setSelectedDayId(day.id); setActiveTab("schedule"); }}>
          <Plus size={20} aria-hidden />
          여기 어때?
        </button>
        <button type="button" onClick={() => setActiveTab("accounting")}>
          <CircleDollarSign size={20} aria-hidden />
          돈 계산
        </button>
        <button type="button" onClick={() => setActiveTab("more")}>
          <ClipboardCheck size={20} aria-hidden />
          승인 대기
        </button>
      </section>

      <section className="section-block">
        <div className="section-header">
          <div>
            <div className="section-kicker">{day.city}</div>
            <h3>핵심 일정</h3>
          </div>
          <span className="member-pill" style={{ color: currentMember.color, backgroundColor: currentMember.backgroundColor }}>
            {currentMember.name}
          </span>
        </div>
        <div className="compact-list">
          {dayItems.map((item) => (
            <TimelineCompact key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-header">
          <h3>확정 후보</h3>
          <span className="count-pill">{approvedPlaces.length}</span>
        </div>
        {approvedPlaces.length ? (
          <div className="place-list compact">
            {approvedPlaces.map((candidate) => (
              <SimplePlaceRow key={candidate.id} candidate={candidate} member={memberById(data.members, candidate.suggestedByMemberId)} />
            ))}
          </div>
        ) : (
          <EmptyState text="아직 오늘 확정된 후보가 없어요." />
        )}
      </section>

      {nextDay && (
        <button
          type="button"
          className="next-card"
          onClick={() => {
            setSelectedDayId(nextDay.id);
            setActiveTab("schedule");
          }}
        >
          <span>다음 일정</span>
          <strong>Day {nextDay.dayNumber}. {nextDay.title}</strong>
          <small>{nextDay.date} · {nextDay.city}</small>
        </button>
      )}
    </div>
  );
}

function ScheduleView({
  data,
  selectedDay,
  currentMember,
  canUseAdmin,
  busy,
  setSelectedDayId,
  runAction
}: {
  data: AppData;
  selectedDay: TripDay;
  currentMember: Member;
  canUseAdmin: boolean;
  busy: boolean;
  setSelectedDayId: (dayId: string) => void;
  runAction: (action: () => Promise<void>, successMessage: string) => void;
}) {
  const [anchor, setAnchor] = useState<{ afterItemId: string | null; beforeItemId: string | null } | null>(null);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<DropPosition | null>(null);
  const pointerDragRef = useRef<PointerDragState | null>(null);
  const items = data.itineraryItems
    .filter((item) => item.dayId === selectedDay.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const itemPhotosByItemId = useMemo(() => {
    const grouped = new Map<string, ItineraryItemPhoto[]>();
    data.itineraryPhotos.forEach((photo) => {
      grouped.set(photo.itemId, [...(grouped.get(photo.itemId) ?? []), photo]);
    });
    return grouped;
  }, [data.itineraryPhotos]);
  const links = data.mapLinks
    .filter((link) => link.dayId === selectedDay.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const selectedDayIndex = data.days.findIndex((day) => day.id === selectedDay.id);
  const previousDay = selectedDayIndex > 0 ? data.days[selectedDayIndex - 1] : null;
  const departureLodging = getLodgingPoint(previousDay) ?? getLodgingPoint(selectedDay);
  const arrivalLodging = getLodgingPoint(selectedDay);

  const moveMapLink = (linkId: string, direction: -1 | 1) => {
    const currentIndex = links.findIndex((link) => link.id === linkId);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= links.length) return;

    const orderedLinks = [...links];
    [orderedLinks[currentIndex], orderedLinks[nextIndex]] = [orderedLinks[nextIndex], orderedLinks[currentIndex]];
    runAction(
      () => reorderMapLinks(selectedDay.id, orderedLinks.map((link) => link.id), currentMember.id),
      "주소 순서를 바꿨어요."
    );
  };

  const removeMapLink = (linkId: string) => {
    if (!window.confirm("이 지도 링크를 삭제할까요?")) return;
    runAction(() => deleteMapLink(linkId, currentMember.id), "지도 링크를 삭제했어요.");
  };

  const removeItineraryItem = (item: ItineraryItem) => {
    if (!window.confirm("이 일정을 삭제할까요?")) return;
    runAction(() => deleteItineraryItem(item.id, currentMember.id), "일정을 삭제했어요.");
  };

  const saveScheduleInput = (input: Parameters<typeof addItineraryItem>[0], beforeItemId: string | null) => {
    if (input.itemType === "place") {
      return addCandidate({
        name: input.placeName || input.title,
        city: input.city,
        category: "etc",
        mapUrl: input.mapUrl,
        reason: input.description,
        memberId: input.memberId,
        dayId: input.dayId,
        afterItemId: input.afterItemId,
        beforeItemId
      });
    }

    return addItineraryItem(input);
  };

  const dropItineraryItem = (draggedItemId: string, targetItemId: string, position: DropPosition) => {
    if (draggedItemId === targetItemId) return;

    const nextItems = [...items];
    const draggingIndex = nextItems.findIndex((item) => item.id === draggedItemId);
    if (draggingIndex < 0) return;

    const [draggingItem] = nextItems.splice(draggingIndex, 1);
    const targetIndex = nextItems.findIndex((item) => item.id === targetItemId);
    if (targetIndex < 0) return;

    nextItems.splice(position === "after" ? targetIndex + 1 : targetIndex, 0, draggingItem);
    runAction(
      () => reorderItineraryItems(selectedDay.id, nextItems.map((item) => item.id), currentMember.id),
      "일정 순서를 바꿨어요."
    );
  };

  const updatePointerDragTarget = (clientX: number, clientY: number, draggedItemId: string) => {
    const element = document.elementFromPoint(clientX, clientY);
    const segment = element?.closest<HTMLElement>("[data-itinerary-id]");
    const targetItemId = segment?.dataset.itineraryId ?? null;

    if (!segment || !targetItemId || targetItemId === draggedItemId) {
      pointerDragRef.current = pointerDragRef.current
        ? { ...pointerDragRef.current, targetItemId: null, position: null }
        : null;
      setDragOverItemId(null);
      setDragOverPosition(null);
      return;
    }

    const rect = segment.getBoundingClientRect();
    const position: DropPosition = clientY > rect.top + rect.height / 2 ? "after" : "before";
    pointerDragRef.current = pointerDragRef.current
      ? { ...pointerDragRef.current, targetItemId, position }
      : null;
    setDragOverItemId(targetItemId);
    setDragOverPosition(position);
  };

  const beginPointerDrag = (itemId: string, event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse" || busy || items.length < 2) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerDragRef.current = { itemId, pointerId: event.pointerId, targetItemId: null, position: null };
    setDraggingItemId(itemId);
    setDragOverItemId(null);
    setDragOverPosition(null);
  };

  const movePointerDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = pointerDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    event.preventDefault();
    updatePointerDragTarget(event.clientX, event.clientY, drag.itemId);
  };

  const finishPointerDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = pointerDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    event.preventDefault();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (drag.targetItemId && drag.position) {
      dropItineraryItem(drag.itemId, drag.targetItemId, drag.position);
    }

    pointerDragRef.current = null;
    setDraggingItemId(null);
    setDragOverItemId(null);
    setDragOverPosition(null);
  };

  return (
    <div className="stack schedule-view">
      <div className="day-tabs" aria-label="날짜 선택">
        {data.days.map((day) => (
          <button
            key={day.id}
            type="button"
            className={day.id === selectedDay.id ? "day-tab active" : "day-tab"}
            onClick={() => {
              setSelectedDayId(day.id);
              setAnchor(null);
            }}
          >
            <span>Day {day.dayNumber}</span>
            <strong>{day.weekday}</strong>
          </button>
        ))}
      </div>

      <section className="day-overview">
        <div className="section-kicker">{selectedDay.date} · {selectedDay.city}</div>
        <h2>{selectedDay.title}</h2>
        <p>{selectedDay.goal}</p>
        {selectedDay.caution && <div className="notice-line">{selectedDay.caution}</div>}
      </section>

      <section className="timeline">
        <LodgingCard lodging={departureLodging} edge="start" />
        {items.map((item, index) => {
          const nextItem = items[index + 1] ?? null;
          const betweenCandidates = data.candidates
            .filter((candidate) => candidate.afterItineraryItemId === item.id)
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          const isDropTarget = dragOverItemId === item.id && draggingItemId !== item.id;
          const segmentClassName = [
            "timeline-segment",
            isDropTarget ? `drop-target drop-${dragOverPosition ?? "after"}` : "",
            draggingItemId === item.id ? "dragging-source" : ""
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div
              key={item.id}
              className={segmentClassName}
              data-itinerary-id={item.id}
              onDragOver={(event) => {
                event.preventDefault();
                if (draggingItemId && draggingItemId !== item.id) {
                  setDragOverItemId(item.id);
                  const rect = event.currentTarget.getBoundingClientRect();
                  setDragOverPosition(event.clientY > rect.top + rect.height / 2 ? "after" : "before");
                }
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setDragOverItemId(null);
                  setDragOverPosition(null);
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                const rect = event.currentTarget.getBoundingClientRect();
                const position = event.clientY > rect.top + rect.height / 2 ? "after" : "before";
                if (draggingItemId) {
                  dropItineraryItem(draggingItemId, item.id, position);
                }
                setDraggingItemId(null);
                setDragOverItemId(null);
                setDragOverPosition(null);
              }}
            >
              <TimelineItem
                item={item}
                photos={itemPhotosByItemId.get(item.id) ?? []}
                members={data.members}
                currentMember={currentMember}
                busy={busy}
                runAction={runAction}
                canDelete={item.id.startsWith("item-user-") && (!item.createdByMemberId || item.createdByMemberId === currentMember.id || canUseAdmin)}
                onDelete={() => removeItineraryItem(item)}
                onDragStart={() => setDraggingItemId(item.id)}
                onDragEnd={() => {
                  setDraggingItemId(null);
                  setDragOverItemId(null);
                  setDragOverPosition(null);
                }}
                onPointerDragStart={(event) => beginPointerDrag(item.id, event)}
                onPointerDragMove={movePointerDrag}
                onPointerDragEnd={finishPointerDrag}
              />
              <div className="between-slot">
                {betweenCandidates.map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    data={data}
                    currentMember={currentMember}
                    canUseAdmin={canUseAdmin}
                    busy={busy}
                    runAction={runAction}
                  />
                ))}
                {anchor?.afterItemId === item.id ? (
                  <ItineraryItemForm
                    day={selectedDay}
                    currentMember={currentMember}
                    afterItemId={item.id}
                    busy={busy}
                    onCancel={() => setAnchor(null)}
                    onSubmit={(input) =>
                      runAction(async () => {
                        await saveScheduleInput(input, nextItem?.id ?? null);
                        setAnchor(null);
                      }, input.itemType === "place" ? "후보를 추가했어요." : "일정을 추가했어요.")
                    }
                  />
                ) : (
                  <button
                    type="button"
                    className="add-between-button"
                    onClick={() => setAnchor({ afterItemId: item.id, beforeItemId: nextItem?.id ?? null })}
                  >
                    <Plus size={16} aria-hidden />
                    아래에 일정/노트 추가
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {!items.length && (
          <div className="between-slot empty-day-slot">
            {anchor?.afterItemId === null ? (
              <ItineraryItemForm
                day={selectedDay}
                currentMember={currentMember}
                afterItemId={null}
                busy={busy}
                onCancel={() => setAnchor(null)}
                onSubmit={(input) =>
                  runAction(async () => {
                    await saveScheduleInput(input, null);
                    setAnchor(null);
                  }, input.itemType === "place" ? "후보를 추가했어요." : "일정을 추가했어요.")
                }
              />
            ) : (
              <button type="button" className="add-between-button" onClick={() => setAnchor({ afterItemId: null, beforeItemId: null })}>
                <Plus size={16} aria-hidden />
                일정/노트 추가
              </button>
            )}
          </div>
        )}
        <LodgingCard lodging={arrivalLodging} edge="end" />
      </section>

      <section className="section-block">
        <div className="section-header">
          <h3>오늘 지도 링크</h3>
          <span className="count-pill">{links.length}</span>
        </div>
        {links.length ? (
          <div className="map-link-list">
            {links.map((link, index) => (
              <div key={link.id} className="map-link-row">
                <a className="map-link-card" href={link.mapUrl} target="_blank" rel="noreferrer">
                  <MapPin size={16} aria-hidden />
                  <span>
                    <strong>{link.placeName}</strong>
                    {link.address && <small>{link.address}</small>}
                  </span>
                  <ExternalLink size={14} aria-hidden />
                </a>
                <div className="map-link-controls">
                  <button
                    type="button"
                    disabled={busy || index === 0}
                    onClick={() => moveMapLink(link.id, -1)}
                    aria-label={`${link.placeName} 위로 이동`}
                  >
                    <ArrowUp size={15} aria-hidden />
                  </button>
                  <button
                    type="button"
                    disabled={busy || index === links.length - 1}
                    onClick={() => moveMapLink(link.id, 1)}
                    aria-label={`${link.placeName} 아래로 이동`}
                  >
                    <ArrowDown size={15} aria-hidden />
                  </button>
                  <button type="button" disabled={busy} onClick={() => removeMapLink(link.id)} aria-label={`${link.placeName} 삭제`}>
                    <Trash2 size={15} aria-hidden />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState text="오늘 저장된 지도 링크가 없어요." />
        )}
      </section>
    </div>
  );
}

function ItineraryItemForm({
  day,
  currentMember,
  afterItemId,
  busy,
  onCancel,
  onSubmit
}: {
  day: TripDay;
  currentMember: Member;
  afterItemId: string | null;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (input: Parameters<typeof addItineraryItem>[0]) => void;
}) {
  const [itemType, setItemType] = useState<ItineraryItemType>("place");
  const [timeLabel, setTimeLabel] = useState("");
  const [title, setTitle] = useState("");
  const [placeName, setPlaceName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState(day.city.split("/")[0]);
  const [mapUrl, setMapUrl] = useState("");
  const [description, setDescription] = useState("");
  const [lookupStatus, setLookupStatus] = useState("");
  const placeTouchedRef = useRef(false);
  const addressTouchedRef = useRef(false);

  useEffect(() => {
    setCity(day.city.split("/")[0]);
  }, [day.id, day.city]);

  useEffect(() => {
    if (itemType !== "place") {
      return;
    }

    if (!mapUrl.trim()) {
      setLookupStatus("");
      return;
    }

    if (!isGoogleMapsUrl(mapUrl)) {
      setLookupStatus("구글 지도 링크를 넣어주세요.");
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLookupStatus("장소 정보를 불러오는 중...");

      try {
        const response = await fetch("/api/maps/metadata", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: mapUrl }),
          signal: controller.signal
        });
        const body = await response.json().catch(() => null);

        if (!response.ok) {
          setLookupStatus(body?.message ?? "지도 제목을 불러오지 못했어요.");
          return;
        }

        if (body?.name && !placeTouchedRef.current) {
          setTitle((current) => current || body.name);
          setPlaceName(body.name);
        }
        if (body?.address && !addressTouchedRef.current) {
          setAddress(body.address);
        }
        if (body?.url && body.url !== mapUrl) {
          setMapUrl(body.url);
        }
        setLookupStatus(body?.name || body?.address ? "장소 정보를 불러왔어요." : "장소명을 직접 적어주세요.");
      } catch (error) {
        if (!controller.signal.aborted) {
          setLookupStatus("장소명을 직접 적어주세요.");
        }
      }
    }, 450);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [itemType, mapUrl]);

  return (
    <form
      className="candidate-form"
      onSubmit={(event) => {
        event.preventDefault();
        const cleanTitle = title.trim();
        onSubmit({
          dayId: day.id,
          memberId: currentMember.id,
          afterItemId,
          itemType,
          timeLabel: timeLabel.trim(),
          title: cleanTitle,
          city: itemType === "note" ? day.city.split("/")[0] : city.trim(),
          placeName: itemType === "note" ? "" : placeName.trim() || cleanTitle,
          address: itemType === "note" ? "" : address.trim(),
          mapUrl: itemType === "note" ? "" : mapUrl.trim(),
          description: description.trim()
        });
      }}
    >
      <div className="segmented item-type-segmented">
        <button type="button" className={itemType === "place" ? "selected" : ""} onClick={() => setItemType("place")}>
          <MapPin size={15} aria-hidden />
          장소
        </button>
        <button type="button" className={itemType === "note" ? "selected" : ""} onClick={() => setItemType("note")}>
          <StickyNote size={15} aria-hidden />
          노트
        </button>
      </div>
      <div className="form-grid">
        <label className="field">
          <span>시간</span>
          <input value={timeLabel} onChange={(event) => setTimeLabel(event.target.value)} placeholder={itemType === "note" ? "노트" : "오전, 14:00"} />
        </label>
        <label className="field">
          <span>{itemType === "note" ? "노트 제목" : "일정명"}</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} required placeholder={itemType === "note" ? "준비물 체크" : "점심, 카페, 산책..."} />
        </label>
      </div>
      {itemType === "place" && (
        <>
          <label className="field">
            <span>구글 지도 링크</span>
            <input
              value={mapUrl}
              onChange={(event) => {
                placeTouchedRef.current = false;
                setMapUrl(event.target.value);
              }}
              placeholder="https://maps.app.goo.gl/..."
            />
            {lookupStatus && <small className="field-hint">{lookupStatus}</small>}
          </label>
          <div className="form-grid">
            <label className="field">
              <span>장소명</span>
              <input
                value={placeName}
                onChange={(event) => {
                  placeTouchedRef.current = true;
                  setPlaceName(event.target.value);
                }}
                placeholder="구글 지도 장소명"
              />
            </label>
            <label className="field">
              <span>도시</span>
              <input value={city} onChange={(event) => setCity(event.target.value)} required />
            </label>
          </div>
          <label className="field">
            <span>주소</span>
            <input
              value={address}
              onChange={(event) => {
                addressTouchedRef.current = true;
                setAddress(event.target.value);
              }}
              placeholder="텍스트로 보일 주소"
            />
          </label>
        </>
      )}
      <label className="field">
        <span>{itemType === "note" ? "내용" : "메모"}</span>
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} placeholder={itemType === "note" ? "일정표에 남길 노트" : "짧은 메모"} />
      </label>
      <div className="form-actions">
        <button type="button" className="ghost-button" onClick={onCancel}>
          취소
        </button>
        <button type="submit" className="primary-button" disabled={busy || !title.trim() || (itemType === "place" && !mapUrl.trim())}>
          <Send size={16} aria-hidden />
          추가
        </button>
      </div>
    </form>
  );
}

function CandidateCard({
  candidate,
  data,
  currentMember,
  canUseAdmin,
  busy,
  runAction
}: {
  candidate: PlaceCandidate;
  data: AppData;
  currentMember: Member;
  canUseAdmin: boolean;
  busy: boolean;
  runAction: (action: () => Promise<void>, successMessage: string) => void;
}) {
  const [comment, setComment] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const recs = data.recommendations.filter((recommendation) => recommendation.placeId === candidate.id);
  const comments = data.comments.filter((placeComment) => placeComment.placeId === candidate.id);
  const photos = data.candidatePhotos.filter((photo) => photo.placeId === candidate.id);
  const recommended = recs.some((recommendation) => recommendation.memberId === currentMember.id);
  const suggestedBy = memberById(data.members, candidate.suggestedByMemberId);
  const canDeleteCandidate = canUseAdmin || candidate.suggestedByMemberId === currentMember.id;

  return (
    <article className={`candidate-card ${candidate.status}`}>
      <div className="candidate-head">
        <div>
          <span className={statusTone[candidate.status]}>{statusLabels[candidate.status]}</span>
          <h4>{candidate.name}</h4>
          <p>{candidate.city} · {categoryLabel(candidate.category)}</p>
        </div>
        <a href={candidate.mapUrl} className="icon-link" target="_blank" rel="noreferrer" aria-label={`${candidate.name} 지도 열기`}>
          <MapPin size={18} aria-hidden />
        </a>
      </div>

      {candidate.reason && <p className="reason-copy">{candidate.reason}</p>}
      {suggestedBy && (
        <span className="member-pill small" style={{ color: suggestedBy.color, backgroundColor: suggestedBy.backgroundColor }}>
          제안 {suggestedBy.name}
        </span>
      )}

      <div className="candidate-actions">
        <button
          type="button"
          className={recommended ? "reaction active" : "reaction"}
          disabled={busy}
          onClick={() =>
            runAction(
              () => toggleRecommendation(candidate.id, currentMember.id, recommended),
              recommended ? "추천을 취소했어요." : "추천했어요."
            )
          }
        >
          <Heart size={16} aria-hidden />
          {recs.length}
        </button>
        <span className="reaction muted">
          <MessageCircle size={16} aria-hidden />
          {comments.length}
        </span>
        {canDeleteCandidate && (
          <button
            type="button"
            className="icon-action danger"
            disabled={busy}
            onClick={() => {
              if (!window.confirm("이 장소 후보를 삭제할까요?")) return;
              runAction(() => deleteCandidate(candidate.id, currentMember.id), "장소 후보를 삭제했어요.");
            }}
            aria-label={`${candidate.name} 삭제`}
          >
            <Trash2 size={16} aria-hidden />
          </button>
        )}
      </div>

      <CandidatePhotoStrip
        candidate={candidate}
        photos={photos}
        members={data.members}
        currentMember={currentMember}
        busy={busy}
        runAction={runAction}
      />

      <div className="comment-list">
        {comments.slice(-2).map((placeComment) => {
          const author = memberById(data.members, placeComment.memberId);
          return (
            <div key={placeComment.id} className="comment-row">
              <strong style={{ color: author?.color }}>{author?.name ?? "멤버"}</strong>
              <span>{placeComment.body}</span>
            </div>
          );
        })}
      </div>

      <form
        className="inline-comment"
        onSubmit={(event) => {
          event.preventDefault();
          runAction(async () => {
            await addComment(candidate.id, currentMember.id, comment);
            setComment("");
          }, "댓글을 남겼어요.");
        }}
      >
        <input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="짧게 한마디" />
        <button type="submit" disabled={busy || !comment.trim()} aria-label="댓글 보내기">
          <Send size={16} aria-hidden />
        </button>
      </form>

      {canUseAdmin && (
        <div className="admin-actions">
          <input value={adminNote} onChange={(event) => setAdminNote(event.target.value)} placeholder="관리자 메모" />
          <div className="admin-button-row">
            <button
              type="button"
              disabled={busy}
              onClick={() => runAction(() => decidePlace(candidate.id, "approved", adminNote, currentMember.id), "후보를 승인했어요.")}
            >
              승인
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => runAction(() => decidePlace(candidate.id, "pending", adminNote, currentMember.id), "후보를 보류했어요.")}
            >
              보류
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => runAction(() => decidePlace(candidate.id, "rejected", adminNote, currentMember.id), "후보를 거절했어요.")}
            >
              거절
            </button>
            {candidate.status === "approved" && (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  runAction(
                    () => markVisited(candidate.id, data.members.map((member) => member.id), currentMember.id, adminNote),
                    "방문 완료로 기록했어요."
                  )
                }
              >
                방문 완료
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

function AccountingView({
  data,
  currentMember,
  busy,
  runAction
}: {
  data: AppData;
  currentMember: Member;
  busy: boolean;
  runAction: (action: () => Promise<void>, successMessage: string) => void;
}) {
  const [type, setType] = useState<ExpenseType>("shared");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("EUR");
  const [category, setCategory] = useState<ExpenseCategory>("food");
  const [note, setNote] = useState("");
  const openRound = getOpenRound(data.settlementRounds);
  const settlement = calculateSettlement(data.members, data.expenses, openRound, data.settlementConfirmations);
  const myConfirmed = Boolean(openRound && settlement.confirmations.some((confirmation) => confirmation.memberId === currentMember.id));
  const myPersonalTotal = data.expenses
    .filter((expense) => expense.type === "personal" && expense.paidByMemberId === currentMember.id)
    .reduce((sum, expense) => sum + expense.amountKrw, 0);

  const submitExpense = (event: FormEvent) => {
    event.preventDefault();
    runAction(
      () =>
        addExpense({
          type,
          title,
          amount: Number(amount),
          currency,
          paidByMemberId: currentMember.id,
          spentForMemberId: currentMember.id,
          date: new Date().toISOString().slice(0, 10),
          category,
          note,
          settlementRoundId: openRound?.id ?? null,
          memberIds: data.members.map((member) => member.id)
        }),
      "비용을 기록했어요."
    );
    setTitle("");
    setAmount("");
    setNote("");
  };

  return (
    <div className="stack">
      <section className="summary-grid">
        <MetricCard label="공동 비용" value={`${formatKrw(settlement.totalKrw)}`} sub={`${formatEur(settlement.totalEur)}`} />
        <MetricCard label="내 개인 비용" value={formatKrw(myPersonalTotal)} sub={`환율 ${getExchangeRate().toLocaleString("ko-KR")}원`} />
      </section>

      <form className="section-block form-stack" onSubmit={submitExpense}>
        <div className="section-header">
          <h3>비용 추가</h3>
          <CircleDollarSign size={20} aria-hidden />
        </div>
        <div className="segmented">
          <button type="button" className={type === "shared" ? "selected" : ""} onClick={() => setType("shared")}>
            모두에게
          </button>
          <button type="button" className={type === "personal" ? "selected" : ""} onClick={() => setType("personal")}>
            나에게
          </button>
        </div>
        <label className="field">
          <span>비용명</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="점심, 택시, 장보기..." />
        </label>
        <div className="form-grid">
          <label className="field">
            <span>금액</span>
            <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" required />
          </label>
          <label className="field">
            <span>통화</span>
            <select value={currency} onChange={(event) => setCurrency(event.target.value as Currency)}>
              <option value="EUR">EUR</option>
              <option value="KRW">KRW</option>
            </select>
          </label>
        </div>
        <label className="field">
          <span>카테고리</span>
          <select value={category} onChange={(event) => setCategory(event.target.value as ExpenseCategory)}>
            {expenseCategoryOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>메모</span>
          <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="선택" />
        </label>
        <button className="primary-button" type="submit" disabled={busy || !title || !amount}>
          <Plus size={16} aria-hidden />
          기록하기
        </button>
      </form>

      <section className="section-block">
        <div className="section-header">
          <h3>정산 요약</h3>
          <span className="count-pill">{settlement.confirmations.length}/4</span>
        </div>
        <div className="settlement-table">
          {settlement.members.map((row) => {
            const member = memberById(data.members, row.memberId);
            return (
              <div key={row.memberId} className="settlement-row">
                <span className="member-dot" style={{ backgroundColor: member?.color }} />
                <strong>{member?.name}</strong>
                <span className="money-pair align-right">
                  <b>{formatKrw(row.balanceKrw)}</b>
                  <small>{formatEur(row.balanceEur)}</small>
                </span>
              </div>
            );
          })}
        </div>
        <div className="transfer-list">
          {settlement.transfers.length ? (
            settlement.transfers.map((transfer) => (
              <div key={`${transfer.fromMemberId}-${transfer.toMemberId}`} className="transfer-row">
                <span>{memberById(data.members, transfer.fromMemberId)?.name}</span>
                <strong>→</strong>
                <span>{memberById(data.members, transfer.toMemberId)?.name}</span>
                <span className="money-pair align-right">
                  <b>{formatKrw(transfer.amountKrw)}</b>
                  <small>{formatEur(transfer.amountEur)}</small>
                </span>
              </div>
            ))
          ) : (
            <EmptyState text="아직 보낼 돈이 없어요." />
          )}
        </div>
        <button
          className="primary-button"
          type="button"
          disabled={busy || !openRound || myConfirmed}
          onClick={() => openRound && runAction(() => confirmSettlement(openRound.id, currentMember.id), "정산 완료를 눌렀어요.")}
        >
          <CheckCircle2 size={16} aria-hidden />
          {myConfirmed ? "내 정산 완료" : "정산 완료"}
        </button>
      </section>

      <section className="section-block">
        <div className="section-header">
          <h3>비용 목록</h3>
          <span className="count-pill">{data.expenses.length}</span>
        </div>
        <div className="expense-list">
          {data.expenses.slice(0, 8).map((expense) => (
            <div key={expense.id} className="expense-row">
              <div>
                <strong>{expense.title}</strong>
                <span>{memberById(data.members, expense.paidByMemberId)?.name} · {expense.type === "shared" ? "공동" : "개인"}</span>
              </div>
              <span className="expense-amount">{expense.currency === "EUR" ? formatEur(expense.amount) : formatKrw(expense.amount)}</span>
              {(expense.paidByMemberId === currentMember.id || currentMember.role === "admin") && (
                <button
                  type="button"
                  className="icon-action danger"
                  disabled={busy}
                  onClick={() => {
                    if (!window.confirm("이 비용을 삭제할까요?")) return;
                    runAction(() => deleteExpense(expense.id, currentMember.id), "비용을 삭제했어요.");
                  }}
                  aria-label={`${expense.title} 삭제`}
                >
                  <Trash2 size={16} aria-hidden />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function MoreView({
  data,
  currentMember,
  canUseAdmin,
  busy,
  runAction,
  onRefresh,
  onChangeMember
}: {
  data: AppData;
  currentMember: Member;
  canUseAdmin: boolean;
  busy: boolean;
  runAction: (action: () => Promise<void>, successMessage: string) => void;
  onRefresh: () => void;
  onChangeMember: () => void;
}) {
  const pendingPlaces = data.candidates.filter((candidate) => ["suggested", "pending"].includes(candidate.status));

  return (
    <div className="stack">
      <section className="section-block">
        <div className="section-header">
          <div>
            <div className="section-kicker">현재 멤버</div>
            <h3>{currentMember.name}</h3>
          </div>
          <span className="member-pill" style={{ color: currentMember.color, backgroundColor: currentMember.backgroundColor }}>
            {currentMember.role === "admin" ? "관리자" : "멤버"}
          </span>
        </div>
        <div className="button-stack">
          <button type="button" className="ghost-button" onClick={onRefresh}>
            <RefreshCw size={16} aria-hidden />
            새로고침
          </button>
          <button type="button" className="ghost-button" onClick={onChangeMember}>
            <UserRound size={16} aria-hidden />
            멤버 변경
          </button>
        </div>
      </section>

      <section className="section-block">
        <div className="section-header">
          <h3>픽스 기다리는 중</h3>
          <span className="count-pill">{pendingPlaces.length}</span>
        </div>
        {pendingPlaces.length ? (
          <div className="place-list">
            {pendingPlaces.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                data={data}
                currentMember={currentMember}
                canUseAdmin={canUseAdmin}
                busy={busy}
                runAction={runAction}
              />
            ))}
          </div>
        ) : (
          <EmptyState text="승인 기다리는 후보가 없어요." />
        )}
      </section>

      <section className="section-block setup-list">
        <div className="section-header">
          <h3>Supabase 연결 메모</h3>
        </div>
        <ol>
          <li>Supabase SQL Editor에서 `supabase/migrations/001_initial_schema.sql` 실행</li>
          <li>`.env`에 Supabase URL, anon key, service role key, 관리자 코드 입력</li>
          <li>`npm run seed:supabase`로 기본 일정 넣기</li>
        </ol>
      </section>
    </div>
  );
}

function LodgingCard({ lodging, edge }: { lodging: LodgingPoint | null; edge: "start" | "end" }) {
  if (!lodging) {
    return null;
  }

  return (
    <article className="lodging-card">
      <div className="lodging-icon">
        <BedDouble size={18} aria-hidden />
      </div>
      <div className="lodging-detail">
        <span>{edge === "start" ? "출발 숙소" : "도착 숙소"}</span>
        <strong title={lodging.name}>{lodging.name}</strong>
        {lodging.address && <p className="lodging-address">{lodging.address}</p>}
        {lodging.mapUrl && (
          <a className="lodging-google-link" href={lodging.mapUrl} target="_blank" rel="noreferrer">
            <MapPin size={14} aria-hidden />
            구글 지도
          </a>
        )}
      </div>
      <div className="lodging-actions">
        {lodging.address && (
          <button
            type="button"
            className="lodging-copy-button"
            title="주소 복사"
            aria-label={`${lodging.name} 주소 복사`}
            onClick={() => {
              void window.navigator.clipboard?.writeText(lodging.address);
            }}
          >
            <Copy size={17} aria-hidden />
          </button>
        )}
      </div>
    </article>
  );
}

function TimelineItem({
  item,
  photos,
  members,
  currentMember,
  busy,
  runAction,
  canDelete,
  onDelete,
  onDragStart,
  onDragEnd,
  onPointerDragStart,
  onPointerDragMove,
  onPointerDragEnd
}: {
  item: ItineraryItem;
  photos: ItineraryItemPhoto[];
  members: Member[];
  currentMember: Member;
  busy: boolean;
  runAction: (action: () => Promise<void>, successMessage: string) => void;
  canDelete: boolean;
  onDelete: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onPointerDragStart: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerDragMove: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerDragEnd: (event: ReactPointerEvent<HTMLButtonElement>) => void;
}) {
  const isNote = item.itemType === "note";
  const displayTitle = !isNote && item.placeName ? item.placeName : item.title;
  const displayAddress = !isNote && item.address && item.address !== displayTitle ? item.address : "";

  return (
    <article className={`timeline-item importance-${item.importance} item-type-${item.itemType}`}>
      <button
        type="button"
        className="drag-handle"
        draggable
        title="순서 옮기기"
        aria-label={`${displayTitle} 순서 옮기기`}
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", item.id);
          onDragStart();
        }}
        onDragEnd={onDragEnd}
        onPointerDown={onPointerDragStart}
        onPointerMove={onPointerDragMove}
        onPointerUp={onPointerDragEnd}
        onPointerCancel={onPointerDragEnd}
      >
        <GripVertical size={17} aria-hidden />
      </button>
      <div className="time-pill">{item.timeLabel}</div>
      <div className="timeline-body">
        <div className="timeline-title-row">
          <h3>{displayTitle}</h3>
          {isNote && <span className="badge badge-muted">노트</span>}
        </div>
        {displayAddress && <small className="address-line">{displayAddress}</small>}
        {item.description && <span>{item.description}</span>}
        <ItineraryPhotoStrip
          item={item}
          photos={photos}
          members={members}
          currentMember={currentMember}
          busy={busy}
          runAction={runAction}
        />
      </div>
      <div className="timeline-actions">
        {item.mapUrl && (
          <a className="icon-action" href={item.mapUrl} target="_blank" rel="noreferrer" aria-label={`${displayTitle} 지도 열기`}>
            <MapPin size={18} aria-hidden />
          </a>
        )}
        {canDelete && (
          <button type="button" className="icon-action danger" disabled={busy} onClick={onDelete} aria-label={`${displayTitle} 삭제`}>
            <Trash2 size={16} aria-hidden />
          </button>
        )}
      </div>
    </article>
  );
}

function ItineraryPhotoStrip({
  item,
  photos,
  members,
  currentMember,
  busy,
  runAction
}: {
  item: ItineraryItem;
  photos: ItineraryItemPhoto[];
  members: Member[];
  currentMember: Member;
  busy: boolean;
  runAction: (action: () => Promise<void>, successMessage: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const myPhoto = photos.find((photo) => photo.memberId === currentMember.id);

  return (
    <div className="photo-strip">
      {photos.length > 0 && (
        <div className="photo-list">
          {photos.map((photo) => {
            const member = memberById(members, photo.memberId);
            return (
              <figure key={photo.id} className="photo-thumb">
                <img src={photo.imageUrl} alt={`${member?.name ?? "멤버"} ${item.title} 사진`} />
                <figcaption style={{ color: member?.color }}>{member?.name ?? "멤버"}</figcaption>
              </figure>
            );
          })}
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          runAction(() => uploadItineraryPhoto(item.id, currentMember.id, file), "사진을 올렸어요.");
        }}
      />
      <button type="button" className="photo-upload-button" disabled={busy} onClick={() => fileInputRef.current?.click()}>
        <ImagePlus size={15} aria-hidden />
        {myPhoto ? "내 사진 교체" : "내 사진 추가"}
      </button>
    </div>
  );
}

function CandidatePhotoStrip({
  candidate,
  photos,
  members,
  currentMember,
  busy,
  runAction
}: {
  candidate: PlaceCandidate;
  photos: PlaceCandidatePhoto[];
  members: Member[];
  currentMember: Member;
  busy: boolean;
  runAction: (action: () => Promise<void>, successMessage: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const myPhoto = photos.find((photo) => photo.memberId === currentMember.id);

  return (
    <div className="photo-strip candidate-photo-strip">
      {photos.length > 0 && (
        <div className="photo-list">
          {photos.map((photo) => {
            const member = memberById(members, photo.memberId);
            return (
              <figure key={photo.id} className="photo-thumb">
                <img src={photo.imageUrl} alt={`${member?.name ?? "멤버"} ${candidate.name} 사진`} />
                <figcaption style={{ color: member?.color }}>{member?.name ?? "멤버"}</figcaption>
              </figure>
            );
          })}
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          runAction(() => uploadCandidatePhoto(candidate.id, currentMember.id, file), "후보 사진을 올렸어요.");
        }}
      />
      <button type="button" className="photo-upload-button" disabled={busy} onClick={() => fileInputRef.current?.click()}>
        <ImagePlus size={15} aria-hidden />
        {myPhoto ? "내 사진 교체" : "내 사진 추가"}
      </button>
    </div>
  );
}

function TimelineCompact({ item }: { item: ItineraryItem }) {
  return (
    <div className="compact-row">
      <span>{item.timeLabel}</span>
      <strong>{item.title}</strong>
    </div>
  );
}

function SimplePlaceRow({ candidate, member }: { candidate: PlaceCandidate; member: Member | undefined }) {
  return (
    <a className="simple-place-row" href={candidate.mapUrl} target="_blank" rel="noreferrer">
      <span className={statusTone[candidate.status]}>{statusLabels[candidate.status]}</span>
      <strong>{candidate.name}</strong>
      <small>{member?.name ?? "멤버"} 제안</small>
    </a>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{sub}</small>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state">{text}</div>;
}

function isGoogleMapsUrl(value: string) {
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return hostname.includes("google.") || hostname === "maps.app.goo.gl" || hostname === "goo.gl";
  } catch {
    return false;
  }
}

function getNearestDay(days: TripDay[]) {
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  return days.find((day) => day.date >= todayKey) ?? days[days.length - 1];
}

function getLodgingPoint(day: TripDay | null): LodgingPoint | null {
  if (!day?.lodging) {
    return null;
  }

  return {
    name: day.lodging,
    address: day.lodgingAddress,
    mapUrl: day.lodgingMapUrl
  };
}

function memberById(members: Member[], memberId: string) {
  return members.find((member) => member.id === memberId);
}

function categoryLabel(category: PlaceCategory) {
  return categoryOptions.find((option) => option.value === category)?.label ?? "기타";
}

function formatKrw(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function formatEur(value: number) {
  return `€${value.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}`;
}
