# 이탈리아 가아즈아

친구 네 명이 이탈리아 여행 중 함께 쓰기 위한 여행 웹앱 기획 저장소입니다.

코드네임: Recogitaly

## 목표

- 관리자가 짜둔 기본 여행 일정을 요일별로 함께 확인한다.
- 친구들이 식당, 카페, 관광 후보지를 구글 지도 링크로 제안한다.
- 후보 장소에 추천, 코멘트, 방문 확인을 남기고 관리자가 최종 방문지를 승인한다.
- 여행 중 휴대폰으로 빠르게 열 수 있는 가벼운 웹앱으로 만든다.
- 첫 배포는 기본 일정 표시와 장소 제안 흐름에 집중한다.

## 문서

- [기획 개요](docs/01-product-brief.md)
- [사용자와 상황](docs/02-users-and-scenarios.md)
- [기능 명세](docs/03-features.md)
- [정보 구조와 화면](docs/04-information-architecture.md)
- [데이터 모델 초안](docs/05-data-model.md)
- [배포와 기술 방향](docs/06-tech-and-deployment.md)
- [개발 로드맵](docs/07-roadmap.md)
- [여행 운영 메모](docs/08-trip-ops.md)
- [기본 일정 입력 템플릿](docs/09-base-plan-template.md)
- [장소 제안과 승인 흐름](docs/10-place-approval-flow.md)
- [여행 계획 정리](docs/11-trip-plan.md)
- [회계와 정산 흐름](docs/12-accounting-flow.md)
- [브랜딩과 타이틀](docs/13-branding.md)

## 주요 환경 변수

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_ACCESS_CODE`
- `NEXT_PUBLIC_EXCHANGE_RATE_EUR_KRW`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: 앱 안 지도 검색에 사용
