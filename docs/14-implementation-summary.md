# 구현 정리

최근 반영한 기능과 운영 메모를 한곳에 정리한다. 기준 커밋은 `6f01218 Backfill lodging details in app data`까지다.

## 일정 관리

- 주소가 있는 장소 일정뿐 아니라 일반 노트 일정도 추가할 수 있다.
- 새로 추가한 일정은 선택한 날짜의 기존 일정 아래쪽에 붙는다.
- 일정마다 이동 핸들이 있고, PC와 모바일에서 드래그로 순서를 바꿀 수 있다.
- 순서 변경은 `app/api/itinerary/reorder/route.ts`를 통해 Supabase에 저장된다.
- 일정 추가는 `app/api/itinerary/add/route.ts`를 통해 저장된다.

## 숙소 카드

- 매일 일정 맨 앞에는 출발 숙소 카드가 표시된다.
- 매일 일정 맨 뒤에는 도착 숙소 카드가 표시된다.
- 첫날은 그날 숙소를 출발 숙소로 쓰고, 이후 날짜는 전날 숙소를 출발 숙소로 쓴다.
- 숙소 카드에는 숙소명, 주소 텍스트, 주소 복사 버튼, 구글 지도 링크가 함께 표시된다.
- Supabase에 숙소 주소나 지도 링크가 비어 있어도 `src/data/baseData.ts`의 기본 숙소 정보로 보정한다.

## 사진 업로드

- 일반 일정에는 멤버 한 명당 사진 하나를 업로드할 수 있다.
- 사람들이 제안한 장소에도 멤버 한 명당 사진 하나를 업로드할 수 있다.
- 일정 사진은 `itinerary_item_photos` 테이블과 `itinerary-photos` 스토리지 버킷을 사용한다.
- 제안 장소 사진은 `place_candidate_photos` 테이블과 `place-candidate-photos` 스토리지 버킷을 사용한다.
- 같은 멤버가 다시 업로드하면 기존 사진을 교체하는 방식으로 동작한다.

## 지도와 주소

- 기존 일정 카드에도 주소 텍스트가 함께 표시된다.
- 구글 지도 링크가 있는 일정과 숙소는 지도 링크를 바로 열 수 있다.
- 일정 추가 폼은 구글 지도 링크를 입력하면 가능한 경우 장소명과 주소 텍스트를 자동으로 채운다.
- 앱 안 지도 검색과 Google Maps JavaScript API 키는 사용하지 않는다.

## Supabase 마이그레이션

기존 Supabase 프로젝트에는 아래 SQL을 순서대로 적용해야 한다.

1. `supabase/migrations/002_schedule_notes_photos.sql`
2. `supabase/migrations/003_candidate_photos.sql`
3. `supabase/migrations/004_backfill_lodging_details.sql`
4. `supabase/migrations/005_place_candidate_address.sql`

각 마이그레이션은 일정 노트, 일정 사진, 제안 장소 사진, 후보 장소 주소, 숙소 주소/지도 링크 보정을 위한 스키마와 데이터를 추가한다.

## 환경 변수

필요한 주요 환경 변수는 다음과 같다.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_ACCESS_CODE`
- `NEXT_PUBLIC_EXCHANGE_RATE_EUR_KRW`

로컬은 `.env`, 배포는 Vercel 환경 변수에 같은 값을 넣는다. 실제 키 값은 저장소 문서나 커밋에 남기지 않는다.

## 최근 커밋

- `8688e27 Add editable itinerary notes and photos`
- `a52fda3 Support mobile itinerary dragging`
- `c56fff7 Allow photos on suggested places`
- `52479f3 Show departure and arrival lodging cards`
- `42a77c7 Show lodging address and map link`
- `6f01218 Backfill lodging details in app data`

## 다음 후보 작업

- 구글 지도 앱으로 오늘 일정 동선을 여는 링크 추가
- 지도 API 비용을 줄이기 위한 Google Maps URL 기반 흐름 검토
- 모바일에서 긴 일정/주소 텍스트가 더 편하게 보이도록 카드 밀도 조정
