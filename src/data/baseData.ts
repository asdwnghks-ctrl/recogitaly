import type { DayMapLink, ItineraryItem, Member, Trip, TripDay } from "@/lib/types";

export const trip: Trip = {
  id: "trip-italy-2026",
  title: "이탈리아 가아즈아",
  startDate: "2026-06-02",
  endDate: "2026-06-12",
  cities: ["로마", "베네치아", "돌로미티", "피렌체"]
};

export const members: Member[] = [
  {
    id: "member-juhwan",
    name: "주환",
    username: "juhwan",
    colorName: "Blue",
    color: "#2563eb",
    backgroundColor: "#dbeafe",
    role: "admin"
  },
  {
    id: "member-jihwan",
    name: "지환",
    username: "jihwan",
    colorName: "Emerald",
    color: "#059669",
    backgroundColor: "#d1fae5",
    role: "member"
  },
  {
    id: "member-jiwan",
    name: "지완",
    username: "jiwan",
    colorName: "Amber",
    color: "#d97706",
    backgroundColor: "#fef3c7",
    role: "member"
  },
  {
    id: "member-jiwon",
    name: "지원",
    username: "jiwon",
    colorName: "Rose",
    color: "#e11d48",
    backgroundColor: "#ffe4e6",
    role: "member"
  }
];

export const tripDays: TripDay[] = [
  {
    id: "day-01",
    tripId: trip.id,
    dayNumber: 1,
    date: "2026-06-02",
    weekday: "화",
    title: "로마 도착과 웰컴 파티",
    city: "로마",
    summary: "인천 출발, 로마 다빈치 공항 도착",
    lodging: "로마 아파트",
    goal: "이탈리아 도착, 숙소 이동, Eataly에서 장보기, 숙소 웰컴 파티",
    caution: "6월 2일은 이탈리아 공화국의 날이라 도심 행사와 교통 통제가 있을 수 있음"
  },
  {
    id: "day-02",
    tripId: trip.id,
    dayNumber: 2,
    date: "2026-06-03",
    weekday: "수",
    title: "고대 로마와 광장 산책",
    city: "로마",
    summary: "로마 풀 투어, 19:15 집회",
    lodging: "로마 아파트",
    goal: "로마 고대 유적과 대표 광장을 연결해서 하루 풀 투어 후 저녁 집회 참석",
    caution: "도보 이동이 많은 날이므로 편한 신발, 물, 중간 휴식 필수"
  },
  {
    id: "day-03",
    tripId: trip.id,
    dayNumber: 3,
    date: "2026-06-04",
    weekday: "목",
    title: "바티칸, 휴식, 테베레 러닝",
    city: "로마",
    summary: "바티칸 관광, 숙소 휴식, 테베레 러닝, 트라스테베레 맥주",
    lodging: "로마 아파트",
    goal: "오전에는 바티칸 쪽을 보고, 오후에는 쉬었다가 저녁에 가볍게 뛰고 맥주",
    caution: "바티칸 권역은 오전부터 사람이 많을 수 있어 일찍 움직이기"
  },
  {
    id: "day-04",
    tripId: trip.id,
    dayNumber: 4,
    date: "2026-06-05",
    weekday: "금",
    title: "아피아 러닝과 베네치아 이동",
    city: "로마/피렌체/베네치아",
    summary: "로마 체크아웃, 피렌체 기차 이동, 렌터카 픽업, 베네치아 이동",
    lodging: "베네치아 아파트",
    goal: "로마에서 피렌체까지 기차 이동 후 렌터카를 픽업하고 베네치아로 이동",
    caution: "11:55 기차와 14:30 렌터카 픽업이 고정이라 이동은 여유 있게"
  },
  {
    id: "day-05",
    tripId: trip.id,
    dayNumber: 5,
    date: "2026-06-06",
    weekday: "토",
    title: "트레치메 트래킹 데이",
    city: "돌로미티",
    summary: "베네치아 체크아웃, 트레치메 트래킹, 돌로미티 이동",
    lodging: "돌로미티 숙소",
    goal: "트레치메 트래킹을 중심으로 돌로미티 첫날 핵심 풍경 보기",
    caution: "09:00 트레치메 주차 예약 고정. 06:00 출발 엄수"
  },
  {
    id: "day-06",
    tripId: trip.id,
    dayNumber: 6,
    date: "2026-06-07",
    weekday: "일",
    title: "카네자이 리프트와 집회",
    city: "돌로미티",
    summary: "카네자이 리프트, 러닝, 17:00 집회",
    lodging: "돌로미티 숙소",
    goal: "낮에는 산악 리프트와 러닝으로 돌로미티를 즐기고 저녁에는 집회 참석",
    caution: "17:00 집회 참석 고정. 리프트 운영 시간과 이동 시간을 미리 확인"
  },
  {
    id: "day-07",
    tripId: trip.id,
    dayNumber: 7,
    date: "2026-06-08",
    weekday: "월",
    title: "서부 돌로미티 파노라마",
    city: "돌로미티",
    summary: "오르티세이, 세체다, 알페 디 시우시",
    lodging: "돌로미티 숙소",
    goal: "서부 돌로미티 대표 코스인 세체다와 알페 디 시우시를 하루에 보기",
    caution: "케이블카 운영 시간, 날씨, 주차/이동 시간을 미리 확인"
  },
  {
    id: "day-08",
    tripId: trip.id,
    dayNumber: 8,
    date: "2026-06-09",
    weekday: "화",
    title: "피렌체로 내려가는 날",
    city: "돌로미티/피렌체",
    summary: "돌로미티 체크아웃, 피렌체 이동, 렌터카 반납",
    lodging: "피렌체 숙소",
    goal: "14:30 반납 시간에 맞춰 피렌체로 내려오고 여유로운 저녁 보내기",
    caution: "14:30 차량 반납 고정. 지연되면 중간 경유지는 생략"
  },
  {
    id: "day-09",
    tripId: trip.id,
    dayNumber: 9,
    date: "2026-06-10",
    weekday: "수",
    title: "피렌체 산책과 노을",
    city: "피렌체",
    summary: "두오모, 산 로렌초, 시뇨리아, 베키오 다리, 미켈란젤로 광장",
    lodging: "피렌체 숙소",
    goal: "피렌체 중심부와 올트라르노를 걸으며 풀데이 즐기기",
    caution: "미켈란젤로 광장 노을 시간에 맞춰 후반 동선 조절"
  },
  {
    id: "day-10",
    tripId: trip.id,
    dayNumber: 10,
    date: "2026-06-11",
    weekday: "목",
    title: "로마로 돌아가는 출국일",
    city: "피렌체/로마",
    summary: "피렌체 체크아웃, 로마 기차 이동, 로마 다빈치 공항 출발",
    lodging: "기내",
    goal: "기차로 로마 이동 후 여유 있게 공항으로 이동해 한국행 항공편 탑승",
    caution: "출국 수속과 공항 이동 시간을 넉넉히 확보"
  },
  {
    id: "day-11",
    tripId: trip.id,
    dayNumber: 11,
    date: "2026-06-12",
    weekday: "금",
    title: "한국 도착",
    city: "인천",
    summary: "인천 도착",
    lodging: "",
    goal: "한국 도착 및 귀가",
    caution: ""
  }
];

const google = "https://www.google.com/maps/search/?api=1&query=";

export const itineraryItems: ItineraryItem[] = [
  item("01-01", "day-01", 1, "12:35", "인천 출발", "인천", "인천국제공항", `${google}Incheon+International+Airport`, "로마행 항공편 탑승", "high"),
  item("01-02", "day-01", 2, "19:15", "로마 도착", "로마", "다빈치 공항", `${google}Fiumicino+Airport`, "로마 도착 후 입국 및 숙소 이동", "high"),
  item("01-03", "day-01", 3, "저녁", "공항에서 숙소 권역 이동", "로마", "다빈치 공항 -> Roma Ostiense -> 로마 아파트", `${google}Roma+Ostiense`, "FL1 공항철도로 Roma Ostiense 하차 후 택시로 숙소 이동", "high"),
  item("01-04", "day-01", 4, "저녁", "숙소 체크인", "로마", "로마 아파트", `${google}via+luigi+fincati+14+int+11+Roma`, "짐 풀고 컨디션 확인", "high"),
  item("01-05", "day-01", 5, "저녁", "Eataly 장보기", "로마", "Eataly Roma Ostiense", "https://maps.app.goo.gl/o42d6t3Lm4iW2eR99", "웰컴 파티용 식재료와 와인 구매", "high"),
  item("01-06", "day-01", 6, "밤", "웰컴 파티", "로마", "로마 아파트", "", "숙소에서 저녁 해먹고 와인 한잔", "normal"),
  item("01-07", "day-01", 7, "밤", "축제 구경 후보", "로마", "로마", "", "컨디션이 괜찮으면 공화국의 날 분위기 구경", "low"),

  item("02-01", "day-02", 1, "오전", "숙소에서 Colosseo 이동", "로마", "로마 아파트 -> Colosseo", `${google}Colosseo+Rome`, "Metro B 탑승 후 Colosseo 하차", "high"),
  item("02-02", "day-02", 2, "오전", "로마 고대 유적 투어 시작", "로마", "포로 로마노 / 팔라티노 언덕 주변", `${google}Roman+Forum+Palatine+Hill+Rome`, "로마 고대 유적 중심 산책 및 관람", "high"),
  item("02-03", "day-02", 3, "늦은 오전", "캄피돌리오 언덕", "로마", "캄피돌리오 언덕", `${google}Piazza+del+Campidoglio+Rome`, "포로 로마노 전망과 광장 동선", "high"),
  item("02-04", "day-02", 4, "점심", "점심 후보", "로마", "베네치아 광장 주변", "", "고대 유적 구간을 끝낸 뒤 후보 장소 추천을 받아 결정", "normal"),
  item("02-05", "day-02", 5, "이른 오후", "베네치아 광장", "로마", "베네치아 광장", `${google}Piazza+Venezia+Rome`, "로마 중심부 대표 광장 관람", "high"),
  item("02-06", "day-02", 6, "오후", "트레비 분수", "로마", "트레비 분수", `${google}Trevi+Fountain+Rome`, "베네치아 광장에서 도보 이동. 혼잡 예상", "high"),
  item("02-07", "day-02", 7, "오후", "판테온", "로마", "판테온", `${google}Pantheon+Rome`, "트레비 분수에서 판테온 방향으로 이동", "high"),
  item("02-08", "day-02", 8, "늦은 오후", "나보나 광장", "로마", "나보나 광장", `${google}Piazza+Navona+Rome`, "하루 투어 마무리 광장 산책", "high"),
  item("02-09", "day-02", 9, "19:15", "집회 참석", "로마", "VIA DELLA FERRATELLA IN LATERANO, 39A", `${google}VIA+DELLA+FERRATELLA+IN+LATERANO+39A+00184+ROMA+RM`, "수요일 저녁 집회 참석", "high"),
  item("02-10", "day-02", 10, "저녁", "숙소 복귀", "로마", "집회 장소 -> 로마 아파트", "", "대중교통 또는 택시로 복귀", "normal"),
  item("02-11", "day-02", 11, "저녁", "숙소 저녁", "로마", "로마 아파트", "", "장 본 재료로 저녁 해먹기", "normal"),

  item("03-01", "day-03", 1, "오전", "바티칸 권역 관광", "로마", "바티칸 / 성 베드로 광장 주변", `${google}St+Peter%27s+Square+Vatican`, "바티칸 쪽 중심으로 오전 관광", "high"),
  item("03-02", "day-03", 2, "점심", "점심 후보", "로마", "바티칸 또는 숙소 복귀 동선", "", "후보 장소 추천을 받아 결정", "normal"),
  item("03-03", "day-03", 3, "오후", "숙소 휴식", "로마", "로마 아파트", "", "전날 풀 투어 후 컨디션 회복", "high"),
  item("03-04", "day-03", 4, "저녁", "테베레강 러닝", "로마", "테베레강변", `${google}Tiber+River+Rome`, "가볍게 러닝. 거리와 코스는 컨디션에 따라 조정", "normal"),
  item("03-05", "day-03", 5, "저녁", "트라스테베레 맥주", "로마", "트라스테베레", `${google}Trastevere+Rome`, "러닝 후 맥주 한잔", "normal"),
  item("03-06", "day-03", 6, "밤", "숙소 복귀", "로마", "트라스테베레 -> 로마 아파트", "", "대중교통 또는 택시로 복귀", "normal"),

  item("04-01", "day-04", 1, "이른 오전", "아피아 가도 러닝", "로마", "아피아 가도", `${google}Via+Appia+Antica+Rome`, "가능한 사람만 가볍게 러닝", "low"),
  item("04-02", "day-04", 2, "오전", "아침 식사", "로마", "로마 아파트", "", "아침을 사 와서 숙소에서 먹기", "normal"),
  item("04-03", "day-04", 3, "오전", "로마 숙소 체크아웃", "로마", "로마 아파트", "", "짐 정리 후 로마 테르미니역 이동", "high"),
  item("04-04", "day-04", 4, "11:55", "로마 출발", "로마", "로마 테르미니역", `${google}Roma+Termini`, "피렌체행 기차 탑승", "high"),
  item("04-05", "day-04", 5, "13:31", "피렌체 도착", "피렌체", "피렌체 산타마리아노벨라역", `${google}Firenze+Santa+Maria+Novella`, "도착 후 렌터카 픽업 지점 이동", "high"),
  item("04-06", "day-04", 6, "점심", "피렌체 간단 점심", "피렌체", "피렌체 산타마리아노벨라역 주변", "", "렌터카 픽업 전후로 가볍게 점심", "normal"),
  item("04-07", "day-04", 7, "14:30", "렌터카 픽업", "피렌체", "1 12/R, Via Borgo Ognissanti", `${google}1+12%2FR+Via+Borgo+Ognissanti+Florence+Italy+50123`, "산타 마리아 노벨라역 인근 렌터카 픽업", "high"),
  item("04-08", "day-04", 8, "오후", "피렌체 전망 포인트 후보", "피렌체", "피렌체", "https://maps.app.goo.gl/UQn1SiS9on1cUFNT9", "시간이 맞으면 피렌체 전망 보기", "low"),
  item("04-09", "day-04", 9, "오후", "베네치아 이동", "베네치아", "피렌체 -> 베네치아", "", "렌터카로 베네치아 숙소 이동", "high"),
  item("04-10", "day-04", 10, "오후", "휴게소 커피", "이동 중", "이동 중 휴게소", "https://maps.app.goo.gl/UcNWXmVXWrioDM8R8", "가는 길에 커피 한잔", "low"),
  item("04-11", "day-04", 11, "저녁", "베네치아 체크인", "베네치아", "베네치아 아파트", `${google}Via+Nervesa+4+06+Venezia`, "숙소 체크인 및 휴식", "normal"),
  item("04-12", "day-04", 12, "저녁", "베네치아 저녁", "베네치아", "베네치아", "", "이날 저녁은 베네치아에서 외식 가능성이 높음", "normal"),
  item("04-13", "day-04", 13, "밤", "베네치아 본섬 투어", "베네치아", "베네치아 본섬", "", "체크인 후 야간 산책", "normal"),

  item("05-01", "day-05", 1, "06:00", "베네치아 숙소 출발", "베네치아", "베네치아 아파트", "", "체크아웃 후 트레치메로 이동", "high"),
  item("05-02", "day-05", 2, "09:00", "트레치메 주차", "돌로미티", "Tre Cime di Lavaredo", "https://pass.auronzo.info/Frontoffice/Acquisti/Carrello", "주차 예약 시간", "high"),
  item("05-03", "day-05", 3, "오전", "트레치메 트래킹", "돌로미티", "Tre Cime di Lavaredo", `${google}Tre+Cime+di+Lavaredo`, "돌로미티 핵심 트래킹", "high"),
  item("05-04", "day-05", 4, "점심", "점심 식사", "돌로미티", "트레치메 주변", "", "트래킹 중 또는 하산 후 식사", "normal"),
  item("05-05", "day-05", 5, "오후", "브라이에스 호수 후보", "돌로미티", "Lago di Braies", "https://maps.app.goo.gl/nWiBKtAgMeFussYZ7", "컨디션과 시간에 따라 방문", "low"),
  item("05-06", "day-05", 6, "오후", "코르티나 담페초 후보", "돌로미티", "Cortina d'Ampezzo", "https://maps.app.goo.gl/BZLQnfjAJPQuRCbeA", "오후 후보 코스", "low"),
  item("05-07", "day-05", 7, "오후", "돌로미티 후보지", "돌로미티", "장소 확인 필요", "https://maps.app.goo.gl/vfBB1aW62JtESfh58", "오후 후보 링크. 장소명 추후 확인", "low"),
  item("05-08", "day-05", 8, "저녁", "장보기", "돌로미티", "장보기 후보", "https://maps.app.goo.gl/FC9scrx9R8XcVMB28", "숙소 저녁용 장보기", "normal"),
  item("05-09", "day-05", 9, "저녁", "돌로미티 숙소 체크인", "돌로미티", "돌로미티 숙소", `${google}via+di+cercena+98+cercena+trentino+alto+adige+38031`, "장 본 재료로 숙소 저녁 준비", "high"),

  item("06-01", "day-06", 1, "오전", "숙소 근처 리프트", "돌로미티", "카네자이 숙소 근처", `${google}Canazei+Italy+cable+car`, "근처 리프트 탑승 후 산악 풍경 보기", "high"),
  item("06-02", "day-06", 2, "오전/오후", "러닝", "돌로미티", "카네자이 주변", `${google}Canazei+Italy`, "컨디션과 날씨에 맞춰 러닝", "normal"),
  item("06-03", "day-06", 3, "점심", "점심 후보", "돌로미티", "카네자이 또는 리프트 주변", "", "후보 장소 추천을 받아 결정", "normal"),
  item("06-04", "day-06", 4, "오후", "휴식 및 집회 준비", "돌로미티", "돌로미티 숙소", "", "이동 전 정비, 복장/소지품 준비", "normal"),
  item("06-05", "day-06", 5, "17:00", "집회 참석", "돌로미티", "VIA DELL'OLMO, 10, 38030 ZIANO DI FIEMME TN", `${google}VIA+DELL%27OLMO+10+38030+ZIANO+DI+FIEMME+TN`, "왕국회관 집회 참석", "high"),
  item("06-06", "day-06", 6, "저녁", "숙소 저녁", "돌로미티", "돌로미티 숙소", "", "집회 후 숙소 복귀, 저녁 해먹기", "normal"),

  item("07-01", "day-07", 1, "오전", "오르티세이 도착", "돌로미티", "오르티세이", `${google}Ortisei+Italy`, "서부 돌로미티 일정 시작", "high"),
  item("07-02", "day-07", 2, "오전", "세체다 케이블카", "돌로미티", "세체다", `${google}Seceda+Ortisei`, "케이블카 탑승 후 전망/산책", "high"),
  item("07-03", "day-07", 3, "점심", "점심 후보", "돌로미티", "오르티세이 또는 세체다 주변", "", "후보 장소 추천을 받아 결정", "normal"),
  item("07-04", "day-07", 4, "오후", "알페 디 시우시 케이블카", "돌로미티", "알페 디 시우시", `${google}Alpe+di+Siusi+cable+car`, "오후 케이블카 탑승 및 산책", "high"),
  item("07-05", "day-07", 5, "저녁", "숙소 복귀", "돌로미티", "알페 디 시우시 -> 돌로미티 숙소", "", "숙소로 돌아와 저녁 준비", "normal"),
  item("07-06", "day-07", 6, "저녁", "숙소 저녁", "돌로미티", "돌로미티 숙소", "", "장 본 재료로 저녁 해먹기", "normal"),

  item("08-01", "day-08", 1, "이른 오전", "돌로미티 숙소 체크아웃", "돌로미티", "돌로미티 숙소", "", "14:30 차량 반납을 위해 일찍 출발", "high"),
  item("08-02", "day-08", 2, "오전", "중간 장보기", "이동 중", "이동 중 장보기 후보", "https://maps.app.goo.gl/shFVq4EFHCnbF2Zz8", "피렌체 도착 전 필요한 장보기", "normal"),
  item("08-03", "day-08", 3, "오전/점심", "짧은 경유지", "이동 중", "이동 중 후보지", "https://maps.app.goo.gl/CZLeQjtUJ2WirraG9", "시간이 맞으면 잠깐 들렀다가 피렌체로 이동", "low"),
  item("08-04", "day-08", 4, "오후", "피렌체 이동", "피렌체", "돌로미티 -> 피렌체", "", "렌터카 반납 시간에 맞춰 이동", "high"),
  item("08-05", "day-08", 5, "14:30", "렌터카 반납", "피렌체", "1 12/R, Via Borgo Ognissanti", `${google}1+12%2FR+Via+Borgo+Ognissanti+Florence+Italy+50123`, "렌터카 픽업과 같은 장소에 반납", "high"),
  item("08-06", "day-08", 6, "오후", "피렌체 체크인", "피렌체", "피렌체 숙소", `${google}viale+giovanni+battista+morgagni+23+Florence`, "숙소 체크인 및 휴식", "normal"),
  item("08-07", "day-08", 7, "저녁", "피렌체 여유 시간", "피렌체", "피렌체", "", "저녁은 피렌체에서 여유롭게 보내기", "normal"),

  item("09-01", "day-09", 1, "오전", "두오모 주변 산책", "피렌체", "두오모 주변", `${google}Cathedral+of+Santa+Maria+del+Fiore+Florence`, "피렌체 풀데이 시작. 두오모와 주변 골목 산책", "high"),
  item("09-02", "day-09", 2, "오전", "산 로렌초 시장", "피렌체", "산 로렌초 시장", `${google}Mercato+di+San+Lorenzo+Florence`, "시장 구경 및 간단 쇼핑/간식 후보", "normal"),
  item("09-03", "day-09", 3, "오전/점심", "장갑 쇼핑 후보", "피렌체", "피렌체", "https://maps.app.goo.gl/348C1C4MUQUu7k5f8", "장갑 구매 후보 장소", "normal"),
  item("09-04", "day-09", 4, "점심", "점심 후보", "피렌체", "두오모/산 로렌초/시뇨리아 주변", "", "후보 장소 추천을 받아 결정", "normal"),
  item("09-05", "day-09", 5, "오후", "시뇨리아 광장", "피렌체", "시뇨리아 광장", `${google}Piazza+della+Signoria+Florence`, "피렌체 중심 광장 관람", "high"),
  item("09-06", "day-09", 6, "오후", "베키오 다리", "피렌체", "베키오 다리", `${google}Ponte+Vecchio+Florence`, "아르노강과 대표 다리 산책", "high"),
  item("09-07", "day-09", 7, "오후", "올트라르노", "피렌체", "올트라르노", `${google}Oltrarno+Florence`, "강 건너 동네 산책, 카페/상점 후보", "normal"),
  item("09-08", "day-09", 8, "해질녘", "미켈란젤로 광장 노을", "피렌체", "미켈란젤로 광장", `${google}Piazzale+Michelangelo+Florence`, "피렌체 전망과 노을 보기", "high"),
  item("09-09", "day-09", 9, "저녁", "피렌체 저녁", "피렌체", "피렌체", "", "노을 후 저녁 또는 숙소 복귀", "normal"),

  item("10-01", "day-10", 1, "오전", "피렌체 숙소 체크아웃", "피렌체", "피렌체 숙소", `${google}viale+giovanni+battista+morgagni+23+Florence`, "짐 정리 후 피렌체 산타마리아노벨라역 이동", "high"),
  item("10-02", "day-10", 2, "11:48", "피렌체 출발", "피렌체", "피렌체 산타마리아노벨라역", `${google}Firenze+Santa+Maria+Novella`, "로마행 기차 탑승", "high"),
  item("10-03", "day-10", 3, "13:30", "로마 도착", "로마", "로마 테르미니역", `${google}Roma+Termini`, "도착 후 공항 이동 준비", "high"),
  item("10-04", "day-10", 4, "점심", "로마 점심", "로마", "로마 테르미니역 주변 또는 이동 동선", "", "마지막 점심. 후보 장소 추천을 받아 결정", "normal"),
  item("10-05", "day-10", 5, "오후", "커피 한잔", "로마", "로마", "", "공항 이동 전 커피 휴식", "normal"),
  item("10-06", "day-10", 6, "오후", "공항 이동", "로마", "로마 -> 다빈치 공항", `${google}Fiumicino+Airport`, "수하물, 이동 시간, 출국 수속 고려해 여유 있게 이동", "high"),
  item("10-07", "day-10", 7, "21:15", "로마 출발", "로마", "다빈치 공항", `${google}Fiumicino+Airport`, "인천행 항공편 탑승", "high"),

  item("11-01", "day-11", 1, "16:10", "인천 도착", "인천", "인천국제공항", `${google}Incheon+International+Airport`, "입국 후 귀가", "high")
];

export const mapLinks: DayMapLink[] = itineraryItems
  .filter((planItem) => planItem.mapUrl)
  .map((planItem, index) => ({
    id: `map-${planItem.id}`,
    dayId: planItem.dayId,
    sortOrder: index + 1,
    placeName: planItem.placeName,
    purpose: planItem.title,
    mapUrl: planItem.mapUrl
  }));

function item(
  id: string,
  dayId: string,
  sortOrder: number,
  timeLabel: string,
  title: string,
  city: string,
  placeName: string,
  mapUrl: string,
  description: string,
  importance: "high" | "normal" | "low"
): ItineraryItem {
  return {
    id: `item-${id}`,
    tripId: trip.id,
    dayId,
    sortOrder,
    timeLabel,
    title,
    city,
    placeName,
    mapUrl,
    description,
    importance
  };
}
