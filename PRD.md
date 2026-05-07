# PRD — Product Requirements Document
## Energy Project Intelligence Platform

| 항목 | 내용 |
|------|------|
| 문서 버전 | v1.0 |
| 작성일 | 2026-04-30 |
| 상태 | 구현 완료 |
| 기술 스택 | HTML5 / CSS3 / Vanilla JS / Vercel Serverless / Anthropic Claude API |

---

## 1. 제품 개요 (Product Overview)

**Energy Project Intelligence Platform**은 포스코인터내셔널 재생에너지 사업 팀이 글로벌 재생에너지 프로젝트의 정보를 빠르게 수집·조회·관리할 수 있도록 설계된 내부 웹 도구다.

Claude AI의 실시간 웹 검색 기능을 활용하여 사용자가 프로젝트명을 입력하면, 위치·용량·참여사·재무지표·계통 현황·최근 뉴스 등 핵심 정보를 자동으로 수집하여 구조화된 대시보드로 제공한다.

### 제품 구성

```
index.html    ← 프로젝트 검색 페이지 (메인)
list.html     ← 글로벌 프로젝트 목록 페이지
api/search.js ← AI 검색 서버리스 함수
api/update-list.js ← 데이터 업데이트 서버리스 함수
```

---

## 2. 사용자 페르소나 (User Personas)

### Persona A — 사업 담당자 (주 사용자)
- **역할**: 재생에너지 프로젝트 발굴 및 분석
- **목표**: 관심 프로젝트의 최신 정보를 빠르게 파악하고 팀에 공유
- **Pain Point**: 여러 소스를 직접 검색하는 데 시간이 많이 걸림
- **주요 사용 흐름**: 프로젝트명 입력 → AI 검색 → 대시보드 확인 → 목록 저장

### Persona B — 팀장 / 투자 의사결정자
- **역할**: 시장 동향 파악 및 투자 방향 결정
- **목표**: 주요 시장별 프로젝트 현황을 한눈에 파악
- **주요 사용 흐름**: 목록 페이지 → 필터/정렬 → 관심 프로젝트 상세 조회

---

## 3. 기능 요구사항 (Functional Requirements)

### 3.1 페이지 1: 프로젝트 검색 (index.html)

#### FR-01. 검색 폼

| 필드 | 타입 | 필수 여부 | 설명 |
|------|------|----------|------|
| 프로젝트명 | Text Input | 필수 | 자동완성 + 자동완성 지원 |
| 국가 | Dropdown | 필수 | 27개국 + 기타 |
| 사업유형 | Dropdown | 필수 | 8개 유형 |
| 사업 참여사 | Text Input | 선택 | 복수 입력 가능 |
| 용량 | Text Input | 선택 | 예: 1.2 GW, 500 MW |

**국가 선택지**: 한국, 일본, 중국, 대만, 호주, 베트남, 필리핀, 인도네시아, 인도, 영국, 독일, 프랑스, 스페인, 이탈리아, 네덜란드, 덴마크, 노르웨이, 미국, 캐나다, 브라질, 칠레, 멕시코, 사우디아라비아, UAE, 남아프리카, 모로코, 기타

**사업유형 선택지**: 해상풍력, 육상풍력, 태양광(Solar PV), 에너지저장장치(BESS), 수력, 복합(태양광+ESS), 복합(풍력+ESS), 기타

#### FR-02. 자동완성 드롭다운

- 프로젝트명 입력 시 초기 데이터(DB) 및 검색 이력에서 Fuse.js 퍼지 매칭
- **초기 데이터(DB) 항목 선택 시**: 국가, 사업유형, 참여사, 용량 자동완성 + 입력창 녹색 하이라이트 0.5초
- **검색 이력 항목 선택 시**: AI 재검색 없이 저장된 대시보드 즉시 로드
- 소스 구분 태그: `DB` (파란색) / `검색이력` (초록색)
- 빈 입력 시: 최근 8개 항목 표시
- 하단 "전체 목록 보기 →" 링크

#### FR-03. AI 검색 실행

1. 폼 제출 → 로딩 화면 전환
2. 로딩 단계 표시: 🌐 웹 검색 중 → 📊 데이터 분석 중 → 📝 리포트 생성 중
3. `/api/search` 엔드포인트 POST 호출
4. Claude claude-sonnet-4-6 + `web_search_20250305` 도구로 정보 수집
5. JSON 구조화 응답 파싱 → 대시보드 렌더링
6. 검색 완료 시 결과를 localStorage에 자동 저장

#### FR-04. 프로젝트 대시보드

대시보드는 다음 섹션으로 구성된다:

**Row 1: 개요 + 위치**
- 프로젝트명 / 대체명 / 태그 (사업유형, 단계, 국가)
- 핵심 메트릭 박스: 용량, 사업단계, 예상 COD
- 현황 텍스트
- 구글맵 임베드 + 좌표 / "Google Maps에서 보기" 링크

**Row 2: 사업 참여사**
- 역할별 그룹: 개발사, 시공사, 운영사, 투자사
- 회사별 지분율 표시 (공개 정보 기준)

**Row 3: 재무지표 + 계통연계 + 전력판매**
- 재무: 총 투자규모, IRR, 예상 발전량(GWh/년), 부지 면적
- 계통: 연계 상태, 변전소, 계통 운영사, Curtailment 리스크 배지
- 전력판매: PPA/시장 판매, 구매자, 계약 기간, 단가

**Row 4: 최근 뉴스/이슈**
- 최대 5건
- Curtailment 관련 뉴스: `⚡ Curtailment` 배지 + 붉은 테두리 강조
- 주요 뉴스: `주요` 배지 + 파란 배경 강조
- 제목, 요약, 날짜, 출처, 링크

**대시보드 상단**
- `← 새 검색` / `← 목록으로` (진입 경로에 따라 변경)
- 데이터 신뢰도 배지: 높음(녹색) / 보통(노란색) / 낮음(빨간색)
- 검색일 표시

#### FR-05. URL 파라미터 처리

| 파라미터 | 동작 |
|---------|------|
| `?project=ID&from=list` | localStorage에서 해당 프로젝트 로드 + "← 목록으로" 버튼 |
| `?prefill=ID` | 초기 데이터에서 해당 프로젝트 폼 자동완성 |

---

### 3.2 페이지 2: 글로벌 프로젝트 목록 (list.html)

#### FR-06. 정렬 가능한 테이블

| 컬럼 | 정렬 | 설명 |
|------|------|------|
| # | — | 행 번호 |
| 프로젝트명 | ↑↓ | 초기값: 오름차순 |
| 국가 | ↑↓ | |
| 사업유형 | ↑↓ | 컬러 배지 표시 |
| 사업 참여사 | ↑↓ | |
| 용량 | ↑↓ | |
| AI 분석 | — | 🔍 분석 버튼 |

- 컬럼 헤더 클릭: 오름차순 → 내림차순 → 오름차순 토글
- 정렬 방향 화살표(↑/↓) 표시
- 현재 정렬 컬럼 파란색 강조

**사업유형 배지 색상**
| 유형 | 색상 |
|------|------|
| 해상풍력 | 파란색 |
| 육상풍력 | 초록색 |
| 태양광 | 노란색 |
| ESS/BESS | 분홍색 |
| 수력 | 청록색 |
| 복합 | 보라색 |

#### FR-07. 퍼지 검색 (Fuse.js)

- 검색 대상 필드: 프로젝트명(weight 4), 참여사(weight 2), 국가(weight 1.5), 사업유형(weight 1), 용량(weight 0.5)
- Threshold: 0.35 (부분 일치 + 오타 허용)
- 검색어 하이라이팅: `<mark>` 태그, 배경 #fef08a
- Fuse.js 매칭 인덱스 기반 정확한 하이라이팅
- 결과 수 표시: "전체 N개 중 M개 결과"

#### FR-08. 필터 및 표시 설정

- 사업유형 필터 칩: 전체 / 해상풍력 / 육상풍력 / 태양광 / ESS / 수력 / 복합
- 페이지당 표시: 25 / 50 / 100 / 전체

#### FR-09. 페이지네이션

- 현재 페이지 파란색 강조
- 최대 7개 페이지 번호 표시
- 이전/다음 버튼, 페이지 이동 시 상단 스크롤

#### FR-10. AI 분석 버튼

- 각 행의 🔍 분석 버튼 클릭 → `index.html?prefill=PROJECT_ID&from=list`
- index.html에서 해당 프로젝트 데이터를 폼에 자동완성

#### FR-11. 데이터 업데이트

- "🔄 데이터 업데이트" 버튼 클릭 → 경고 모달 표시
- **경고 모달 내용**:
  - ⏱️ 완료까지 1~3분 소요
  - 💰 Anthropic API 비용 발생
  - 🔄 업데이트 중 페이지 이탈 금지
  - 💾 결과는 브라우저 로컬 저장
- 확인 → 로딩 오버레이 → `/api/update-list` POST 호출
- 완료 → localStorage에 저장 + 화면 자동 갱신
- 업데이트 날짜 목록 상단에 표시 (초록색)

---

## 4. 데이터 모델 (Data Model)

### 4.1 초기 프로젝트 데이터 (`INITIAL_PROJECTS`)

```javascript
{
  id: String,           // 예: "ow-uk-001"
  projectName: String,  // 예: "Hornsea One"
  country: String,      // 예: "United Kingdom"
  businessType: String, // 예: "Offshore Wind"
  participants: String, // 예: "Ørsted"
  capacity: String      // 예: "1,218 MW"
}
```

### 4.2 AI 검색 응답 스키마

```javascript
{
  projectName: String,
  alternativeNames: String[],
  location: {
    city: String, region: String, country: String,
    coordinates: { lat: Number, lng: Number },
    address: String
  },
  siteSizeHectares: String,
  capacity: { mw: String, mwh: String, unit: String },
  stakeholders: {
    developer:    [{ name, country, equity }],
    constructor:  [{ name, country }],
    operator:     [{ name, country }],
    investor:     [{ name, country, equity, type }]
  },
  phase: "development" | "construction" | "operation",
  timeline: { startYear, codYear, currentStatus },
  financials: {
    expectedGenerationGwh, irr,
    totalInvestmentUSD, totalInvestmentLocal, currency
  },
  gridConnection: {
    status: "connected" | "pending" | "planned" | "unknown",
    substation, transmissionOperator,
    curtailmentRisk: "high" | "medium" | "low" | "unknown",
    curtailmentNotes
  },
  powerPurchase: {
    type: "PPA" | "market" | "merchant" | "unknown",
    buyer, term, price
  },
  news: [{
    title, summary, date, source, url,
    hasCurtailment: Boolean, isHighlight: Boolean
  }],
  dataConfidence: "high" | "medium" | "low",
  searchDate: String,
  sources: String[]
}
```

### 4.3 localStorage 저장 구조

| Key | Value | 설명 |
|-----|-------|------|
| `energy_intel_v1` | JSON Array | 검색 이력 프로젝트 목록 |
| `energy_intel_master_list` | JSON Array | AI 업데이트 프로젝트 목록 |
| `energy_intel_master_updated_at` | ISO 날짜 | 마지막 업데이트 시각 |

---

## 5. API 명세 (API Specification)

### POST /api/search

**프로젝트 상세 정보 AI 검색**

Request Body:
```json
{
  "projectName": "Hornsea One",
  "country": "United Kingdom",
  "businessType": "Offshore Wind",
  "participants": "Ørsted",
  "capacity": "1,218 MW"
}
```

Response: `200 OK` — AI 검색 응답 스키마(§4.2) JSON

Error Response:
```json
{ "error": "에러 메시지" }
```

| 항목 | 값 |
|------|---|
| 모델 | claude-sonnet-4-6 |
| Max Tokens | 4,096 |
| 도구 | web_search_20250305 |
| 최대 소요 시간 | 60초 (Vercel maxDuration) |
| Tool loop 최대 반복 | 8회 |

---

### POST /api/update-list

**글로벌 프로젝트 목록 AI 업데이트**

Request Body: `{}` (빈 객체)

Response: `200 OK`
```json
{
  "projects": [...],
  "updatedAt": "2026-04-30T12:00:00.000Z",
  "count": 142
}
```

| 항목 | 값 |
|------|---|
| 모델 | claude-sonnet-4-6 |
| Max Tokens | 8,192 |
| 예상 소요 시간 | 60~180초 |

---

## 6. 기술 요구사항 (Technical Requirements)

### 6.1 기술 스택

| 레이어 | 기술 |
|--------|------|
| 프론트엔드 | HTML5, CSS3, Vanilla JavaScript (ES2020+) |
| 서버리스 함수 | Vercel Serverless Functions (Node.js 18+) |
| AI | Anthropic Claude claude-sonnet-4-6 + web_search_20250305 |
| 퍼지 검색 | Fuse.js v7.0.0 (CDN) |
| 지도 | Google Maps Embed API (무료 임베드) |
| 저장소 | Browser localStorage |
| 배포 | GitHub + Vercel |

### 6.2 환경변수

| 변수명 | 설명 | 설정 위치 |
|--------|------|----------|
| `ANTHROPIC_API_KEY` | Anthropic API 인증키 | Vercel Environment Variables |

### 6.3 브라우저 지원

- Chrome 90+, Edge 90+, Safari 14+, Firefox 88+
- 모바일 반응형 (768px 기준 브레이크포인트)

### 6.4 성능 요구사항

| 항목 | 목표 |
|------|------|
| 초기 페이지 로드 | 2초 이내 |
| AI 검색 응답 | 60초 이내 |
| 테이블 렌더링 (130개) | 즉시 |
| 퍼지 검색 응답 | 100ms 이내 |

### 6.5 보안 요구사항

- API 키는 Vercel 서버리스 함수에서만 사용 (클라이언트 노출 금지)
- XSS 방지: 모든 사용자 입력값 `escHtml()` 처리
- CORS: Vercel 함수에서 적절한 헤더 설정

---

## 7. UI/UX 요구사항

### 7.1 디자인 원칙

- **전문성**: 비즈니스 도구에 맞는 깔끔하고 전문적인 디자인
- **효율성**: 핵심 정보를 최소한의 클릭으로 접근
- **명확성**: 데이터 신뢰도, 소스 구분 등 정보의 한계를 명확히 표시

### 7.2 색상 시스템

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--blue` | `#1a56db` | 주요 액션, 강조 |
| `--green` | `#0f9b6d` | 운영 단계, 완료, 신뢰도 높음 |
| `--amber` | `#d97706` | 개발 단계, 보통 신뢰도, 주의 |
| `--red` | `#dc2626` | 오류, Curtailment 위험 |

### 7.3 주요 UX 플로우

```
[검색 페이지]
  │
  ├── 프로젝트명 입력
  │     └── 자동완성 드롭다운 표시
  │           ├── DB 항목 선택 → 폼 자동완성
  │           └── 이력 항목 선택 → 대시보드 즉시 표시
  │
  └── AI 검색 시작 클릭
        └── 로딩 (30~60초)
              ├── 성공 → 대시보드 표시 + localStorage 저장
              └── 실패 → 에러 화면 + 재시도

[목록 페이지]
  │
  ├── 검색/필터/정렬
  │
  └── 🔍 분석 버튼 클릭
        └── 검색 페이지로 이동 (폼 자동완성)
              └── 사용자가 AI 검색 시작
```

---

## 8. 미결 사항 및 향후 계획 (Open Issues & Roadmap)

### 현재 미결 사항

| ID | 항목 | 우선순위 |
|----|------|----------|
| OI-01 | 팀 간 실시간 데이터 공유 (현재는 개인 localStorage) | 높음 |
| OI-02 | Google Maps API 키 미설정 시 Fallback 지도 (현재는 임베드 URL 방식) | 낮음 |
| OI-03 | 검색 이력 Export(CSV/Excel) 기능 | 중간 |

### 향후 로드맵

| 버전 | 기능 |
|------|------|
| v1.1 | 프로젝트 북마크 / 비교 기능 |
| v1.2 | 팀 공유를 위한 Vercel KV 백엔드 연동 |
| v1.3 | 정기 업데이트 스케줄링 (Vercel Cron) |
| v2.0 | 프로젝트 포트폴리오 관리 및 알림 기능 |

---

*본 문서는 Energy Project Intelligence Platform v1.0의 제품 요구사항을 정의한다.*
