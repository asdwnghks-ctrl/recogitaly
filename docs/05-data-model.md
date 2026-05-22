# 데이터 모델 초안

## Trip

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| id | string | 여행 ID |
| title | string | 여행 이름 |
| startDate | date | 시작일 |
| endDate | date | 종료일 |
| cities | string[] | 방문 도시 |

## Member

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| id | string | 멤버 ID |
| name | string | 이름 |
| username | string | 앱 아이디 |
| colorName | string | UI 색상 이름 |
| color | string | UI 주요 색 |
| backgroundColor | string | UI 배경 색 |
| role | string | admin 또는 member |
| accessCode | string | 선택 사항. 관리자 확인 또는 간단 보호용 |

초기 멤버:

| id | name | username | colorName | color | backgroundColor | role |
| --- | --- | --- | --- | --- | --- | --- |
| member-juhwan | 주환 | juhwan | Blue | `#2563eb` | `#dbeafe` | admin |
| member-jihwan | 지환 | jihwan | Emerald | `#059669` | `#d1fae5` | member |
| member-jiwan | 지완 | jiwan | Amber | `#d97706` | `#fef3c7` | member |
| member-jiwon | 지원 | jiwon | Rose | `#e11d48` | `#ffe4e6` | member |

## TripDay

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| id | string | 날짜 ID |
| tripId | string | 여행 ID |
| date | date | 날짜 |
| weekday | string | 요일 |
| title | string | 하루 제목 |
| city | string | 대표 도시 |
| summary | string | 하루 요약 |
| lodgingPlaceId | string | 숙소 장소 ID |

## ItineraryItem

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| id | string | 일정 ID |
| tripId | string | 여행 ID |
| dayId | string | 날짜 ID |
| timeLabel | string | 오전, 점심, 오후, 저녁 또는 구체 시간 |
| startTime | string | 시작 시간 |
| endTime | string | 종료 시간 |
| title | string | 일정 제목 |
| city | string | 도시 |
| placeName | string | 장소명 |
| mapUrl | string | 구글 지도 링크 |
| description | string | 설명 |
| importance | string | high, normal, low |
| approvedPlaceIds | string[] | 승인된 후보 장소 ID 목록 |

## PlaceCandidate

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| id | string | 후보 장소 ID |
| tripId | string | 여행 ID |
| name | string | 장소명 |
| city | string | 도시 |
| category | string | food, cafe, dessert, bar, sight, shopping, etc |
| mapUrl | string | 구글 지도 링크 |
| suggestedByMemberId | string | 제안자 |
| relatedDayId | string | 관련 날짜 ID |
| relatedItineraryItemId | string | 관련 일정 ID |
| afterItineraryItemId | string | 이 일정 뒤에 후보를 표시 |
| beforeItineraryItemId | string | 이 일정 앞에 후보를 표시 |
| reason | string | 추천 이유 |
| status | string | suggested, approved, pending, rejected, visited |
| adminNote | string | 관리자 결정 메모 |
| createdAt | datetime | 생성 시간 |
| updatedAt | datetime | 수정 시간 |

## PlaceRecommendation

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| id | string | 추천 ID |
| placeId | string | 후보 장소 ID |
| memberId | string | 추천한 멤버 ID |
| createdAt | datetime | 추천 시간 |

## PlaceComment

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| id | string | 코멘트 ID |
| placeId | string | 후보 장소 ID |
| memberId | string | 작성자 |
| body | string | 내용 |
| createdAt | datetime | 작성 시간 |

## PlaceApproval

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| id | string | 승인 기록 ID |
| placeId | string | 후보 장소 ID |
| decidedByMemberId | string | 승인/보류/거절한 관리자 |
| decision | string | approved, pending, rejected |
| relatedDayId | string | 승인 시 연결한 날짜 ID |
| relatedItineraryItemId | string | 승인 시 연결한 일정 ID |
| approvedAfterItineraryItemId | string | 승인 후 표시할 앞 일정 ID |
| approvedBeforeItineraryItemId | string | 승인 후 표시할 뒤 일정 ID |
| note | string | 결정 메모 |
| createdAt | datetime | 결정 시간 |

## VisitCheck

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| id | string | 방문 확인 ID |
| placeId | string | 후보 장소 ID |
| memberIds | string[] | 방문한 멤버 |
| checkedByMemberId | string | 기록한 멤버 |
| note | string | 후기 또는 메모 |
| visitedAt | datetime | 방문 시간 |

## Expense

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| id | string | 비용 ID |
| tripId | string | 여행 ID |
| settlementRoundId | string | 정산 라운드 ID. 개인 비용은 비워둘 수 있음 |
| type | string | personal 또는 shared |
| title | string | 비용명 |
| amount | number | 금액 |
| currency | string | 통화 |
| exchangeRateToKrw | number | 입력 시점의 원화 환율. KRW면 1 |
| amountKrw | number | 원화 환산 금액 |
| amountEur | number | 유로 환산 금액 |
| paidByMemberId | string | 결제자 |
| spentForMemberId | string | personal일 때 대상 멤버. 보통 본인 |
| participantMemberIds | string[] | shared일 때 참여 멤버. 기본은 네 명 전체 |
| date | date | 결제일 |
| category | string | food, cafe, grocery, transport, lodging, ticket, shopping, etc |
| note | string | 메모 |
| createdAt | datetime | 생성 시간 |

## SettlementRound

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| id | string | 정산 라운드 ID |
| tripId | string | 여행 ID |
| status | string | open 또는 closed |
| openedAt | datetime | 라운드 시작 시간 |
| closedAt | datetime | 라운드 종료 시간 |

## SettlementTransfer

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| id | string | 송금 제안 ID |
| settlementRoundId | string | 정산 라운드 ID |
| fromMemberId | string | 돈을 보내야 하는 멤버 |
| toMemberId | string | 돈을 받아야 하는 멤버 |
| amount | number | 금액 |
| currency | string | 통화 |
| status | string | pending 또는 completed |

## SettlementConfirmation

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| id | string | 정산 완료 확인 ID |
| settlementRoundId | string | 정산 라운드 ID |
| memberId | string | 정산 완료를 누른 멤버 |
| confirmedAt | datetime | 확인 시간 |

정산 초기화 규칙:

- 열린 정산 라운드의 shared 비용만 정산 계산에 포함한다.
- 정산 계산은 자동 환율을 반영한 기준 통화 금액으로 수행한다.
- 네 명 모두 `SettlementConfirmation`을 남기면 해당 라운드를 closed로 바꾼다.
- 라운드가 closed되면 새 open 라운드를 만든다.
- personal 비용은 정산 라운드 초기화와 무관하게 개인 기록으로 유지한다.

## ExchangeRate

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| id | string | 환율 기록 ID |
| baseCurrency | string | 기준 통화. 예: EUR |
| quoteCurrency | string | 대상 통화. 예: KRW |
| rate | number | 환율 |
| fetchedAt | datetime | 환율 조회 시간 |
| source | string | 환율 API 출처 |

## Link

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| label | string | 링크 이름 |
| url | string | URL |
