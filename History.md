# History.md — 개발 이력
## Energy Project Intelligence Platform

---

## v1.3.0 — 2026-04-30

### 추가
- **초기 프로젝트 데이터베이스** (`initial-projects.js`): 글로벌 재생에너지 주요 프로젝트 130개 사전 탑재
  - 해상풍력 53개 (영국, 독일, 네덜란드, 덴마크, 대만, 한국, 일본, 미국, 베트남, 호주 등)
  - 태양광 27개 (인도, UAE, 사우디, 미국, 호주, 모로코, 베트남, 필리핀, 한국 등)
  - 육상풍력 9개, ESS/BESS 9개, 수력 5개, 복합 6개
- **정렬 가능한 테이블** (list.html 전면 재설계)
  - 5개 컬럼 (프로젝트명, 국가, 사업유형, 사업 참여사, 용량) 오름차순/내림차순 정렬
  - 컬럼 헤더 클릭으로 정렬 토글, 정렬 방향 화살표 표시
  - 사업유형별 컬러 배지 (해상풍력·태양광·ESS·수력·복합 등)
  - 페이지당 표시 수 선택 (25 / 50 / 100 / 전체)
- **행별 AI 분석 버튼**: 목록 테이블 각 행에서 `🔍 분석` 버튼 클릭 시 해당 프로젝트 정보를 검색 폼에 자동완성
- **데이터 업데이트 기능**
  - "🔄 데이터 업데이트" 버튼 → 경고 모달 (소요시간·비용·이탈금지 안내)
  - `/api/update-list` 신규 Vercel 서버리스 함수 — Claude AI 웹검색으로 130+ 프로젝트 목록 갱신
  - 결과를 localStorage에 저장, 업데이트 날짜 상단 표시
- **자동완성 개선** (app.js)
  - 검색 추천 대상 확장: localStorage 이력 + 초기 데이터(DB) 동시 Fuse.js 퍼지 매칭
  - 소스 구분 태그: `DB` (파란색) / `검색이력` (초록색)
  - **초기 데이터 항목 선택 시 폼 자동완성**: 국가, 사업유형, 참여사, 용량 자동 입력 + 입력창 녹색 하이라이트
  - 검색 이력 항목 선택 시: AI 재검색 없이 저장된 대시보드 즉시 로드 (기존 동작 유지)
- **URL 파라미터 `?prefill=ID`**: 목록 페이지 → 검색 페이지로 이동 시 프로젝트 데이터 폼 자동완성
- **모달 스타일** (style.css): 경고 모달, 업데이트 로딩 오버레이 추가
- **테이블 CSS** (style.css): 테이블 레이아웃, 정렬 헤더, 타입 배지, AI 분석 버튼 스타일
- **자동완성 소스 태그 CSS**: `.ac-source-initial`, `.ac-source-history` 스타일

### 변경
- list.html: 카드 그리드 방식 → 정렬 가능한 테이블 방식으로 전면 재설계
- 목록 페이지 데이터 소스: localStorage 이력 전용 → 초기 데이터 우선, localStorage 업데이트 Override 방식
- 툴바 레이아웃: 사업유형 필터 칩 추가, 정렬 선택 → 표시 수 선택으로 변경
- 헤더 부제목: 데이터 출처 및 업데이트 날짜 표시

### 파일 변경

| 파일 | 변경 유형 |
|------|----------|
| `initial-projects.js` | 신규 추가 |
| `api/update-list.js` | 신규 추가 |
| `list.html` | 전면 재작성 |
| `app.js` | 자동완성·자동완성·URL 파라미터 처리 추가 |
| `index.html` | `initial-projects.js` 스크립트 태그 추가 |
| `style.css` | 모달, 테이블, AC 소스 태그 스타일 추가 |

---

## v1.2.0 — 2026-04-30

### 추가
- **Fuse.js 퍼지 검색** (list.html): 프로젝트명, 국가, 개발사, 투자사, 사업유형 대상 퍼지 매칭
  - 검색어 하이라이팅: Fuse.js 매칭 인덱스 기반 `<mark>` 태그 적용
  - Threshold 0.35 (부분 일치 + 오타 허용)
  - 검색어 없을 때: 최근 저장순 전체 목록 표시
- **자동완성 드롭다운** (index.html): 프로젝트명 입력 시 localStorage 이력에서 실시간 퍼지 매칭
  - 최대 6개 추천, 하단 "전체 목록 보기 →" 링크
  - 항목 클릭 시 저장된 대시보드 즉시 로드 (AI 재검색 불필요)
- **사업단계 필터 칩**: 전체 / 개발 / 건설 / 운영
- **정렬**: 최근 검색순 / 이름순 / 국가순
- **페이지네이션**: 12개/페이지, 최대 7개 페이지 번호 표시
- **카드 삭제 버튼**: 호버 시 `✕` 버튼 표시, 확인 후 localStorage에서 삭제
- **URL 파라미터 처리**: `?project=ID&from=list` — localStorage에서 로드 + "← 목록으로" 버튼
- **뒤로가기 버튼 동적 변경**: 검색에서 진입 시 "← 새 검색", 목록에서 진입 시 "← 목록으로"
- **프로젝트 자동 저장**: AI 검색 완료 시 localStorage에 자동 저장 (중복 시 업데이트)
- **검색 결과 카운트 표시**: "전체 N개 중 M개 결과"
- **헤더 네비게이션**: 로고, 네비게이션 링크, "📂 프로젝트 목록 보기" 버튼
- **공유 스토리지 모듈** (`projects.js`): localStorage CRUD + Fuse.js 엔트리 변환 유틸리티
- **하이라이팅 함수**: `highlightFuse()`, `highlightSimple()` — XSS 안전 처리

### 변경
- index.html: 헤더에 네비게이션 + 목록 버튼 추가
- index.html: 프로젝트명 입력 필드를 `.autocomplete-wrapper` div로 래핑
- app.js: 전면 재작성 — 자동완성, 저장 로직, URL 파라미터, 섹션 전환 개선
- style.css: 헤더 nav, 자동완성 드롭다운, 카드 그리드, 삭제 버튼, 페이지네이션, 빈 상태 스타일 추가

### 파일 변경

| 파일 | 변경 유형 |
|------|----------|
| `projects.js` | 신규 추가 |
| `list.html` | 신규 추가 (카드 그리드 기반) |
| `app.js` | 전면 재작성 |
| `index.html` | 헤더, 자동완성 래퍼, 스크립트 태그 수정 |
| `style.css` | 대규모 스타일 추가 |

---

## v1.1.0 — 2026-04-30

### 최초 구현 — 검색 + 대시보드

#### 프로젝트 초기화

- 프로젝트 폴더: `energy-project-intel/`
- 배포 환경: GitHub + Vercel

#### 추가된 파일

**`index.html`**
- 검색 폼: 프로젝트명(텍스트), 국가(드롭다운 27개국), 사업유형(드롭다운 8종), 참여사(선택), 용량(선택)
- 로딩 화면: 단계별 애니메이션 (웹 검색 중 → 데이터 분석 중 → 리포트 생성 중)
- 에러 화면: 오류 메시지 + 재시도 버튼
- 대시보드: Row 1 (개요+위치), Row 2 (참여사), Row 3 (재무+계통+PPA), Row 4 (뉴스)

**`style.css`**
- CSS Custom Properties 색상 시스템 (`--blue`, `--green`, `--amber`, `--red` 등)
- 반응형 레이아웃 (768px 브레이크포인트)
- 카드 컴포넌트, 배지, 메트릭 박스, 뉴스 아이템, Curtailment 강조 스타일

**`app.js`**
- 섹션 전환 로직 (검색 / 로딩 / 에러 / 대시보드)
- 로딩 단계 애니메이션 타이머
- `/api/search` POST 호출 및 응답 파싱
- 대시보드 렌더링: stakeholders, 재무, 계통, PPA, 뉴스 섹션
- Google Maps 임베드 URL 생성 (좌표 또는 지명 검색)
- XSS 방지 `escHtml()` 처리

**`api/search.js`** (Vercel Serverless)
- 입력: `{ projectName, country, businessType, participants, capacity }`
- Claude claude-sonnet-4-6 + `web_search_20250305` 도구
- Tool loop (최대 8회): tool_use → tool_result → 최종 텍스트 추출
- JSON 파싱 및 구조화 응답 반환
- `maxDuration: 60` 설정

**`package.json`**
- 의존성: `@anthropic-ai/sdk ^0.39.0`
- Node.js 18+ 명시

**`vercel.json`**
- `api/search.js` maxDuration: 60초

**`.gitignore`**
- `node_modules/`, `.env`, `.env.local`, `.vercel`

#### 대시보드 정보 구조 (최초)

| 섹션 | 항목 |
|------|------|
| 개요 | 프로젝트명, 대체명, 사업유형·단계·국가 태그, 용량·단계·COD 메트릭, 현황 텍스트 |
| 위치 | 주소, 좌표, 부지 면적, Google Maps 임베드, 외부 링크 |
| 참여사 | 개발사, 시공사, 운영사, 투자사 (지분율 포함) |
| 재무 | 총 투자규모, IRR, 예상 발전량, 부지 면적 |
| 계통 | 연계 상태, 변전소, 운영사, Curtailment 리스크 배지 |
| 전력판매 | PPA/시장, 구매자, 계약기간, 단가 |
| 뉴스 | 최근 5건, Curtailment 배지·강조 표시 |
| 하단 | 데이터 신뢰도 배지, 검색일, 참고 출처 |

---

## 기술 결정 기록 (Architecture Decision Records)

### ADR-001 — 순수 HTML/JS + Vercel Serverless 아키텍처 선택

- **결정**: React/Vue 등 프레임워크 미사용, Vanilla JS + Vercel Serverless Functions
- **이유**: 별도 서버 없이 배포 가능, 팀 내 유지보수 용이, 빠른 개발 속도
- **트레이드오프**: 상태 관리 복잡도 증가, 컴포넌트 재사용성 제한

### ADR-002 — localStorage 기반 데이터 저장

- **결정**: 중앙 DB 없이 브라우저 localStorage 사용
- **이유**: 서버 없이 운용 가능, 즉시 배포 가능, 인프라 비용 없음
- **트레이드오프**: 팀 간 실시간 공유 불가, 브라우저별 독립 저장
- **향후 계획**: Vercel KV 연동으로 팀 공유 기능 추가 예정

### ADR-003 — Fuse.js 퍼지 검색 라이브러리 선택

- **결정**: Fuse.js v7.0.0 CDN 사용
- **이유**: 순수 클라이언트 사이드 퍼지 검색, 추가 서버 불필요, 한국어/영문 혼용 지원
- **설정값**: threshold 0.35, ignoreLocation true, includeMatches true

### ADR-004 — 초기 데이터 정적 파일 방식

- **결정**: `initial-projects.js`를 정적 JS 파일로 관리, `window.INITIAL_PROJECTS` 전역 노출
- **이유**: CDN 캐싱 효과, 즉시 로드, 서버 요청 불필요
- **트레이드오프**: 코드 배포 없이 데이터 수정 불가 → 업데이트 버튼으로 보완

### ADR-005 — Claude web_search_20250305 도구 사용

- **결정**: Anthropic 내장 웹 검색 도구 사용
- **이유**: 별도 검색 API 계약 불필요, Claude와 통합된 정보 합성
- **트레이드오프**: 응답 시간 증가 (30~60초), API 비용 발생, 네트워크 의존성

---

## 알려진 이슈 및 제한사항

| ID | 이슈 | 상태 | 비고 |
|----|------|------|------|
| BUG-001 | web_search_20250305 도구 비활성화 계정에서 검색 오류 발생 | 미해결 | Anthropic 계정 설정 확인 필요 |
| LIM-001 | localStorage 용량 제한 (약 5MB) — 프로젝트 40개 이상 저장 시 자동 삭제 | 설계된 제한 | 가장 오래된 항목부터 삭제 |
| LIM-002 | 팀원 간 프로젝트 데이터 실시간 공유 불가 | 향후 과제 | Vercel KV 연동으로 해결 예정 |
| LIM-003 | 데이터 정확성은 AI 웹 검색 품질에 의존 | 설계된 제한 | 신뢰도 배지로 사용자 안내 |
| LIM-004 | 업데이트 API 응답 시간이 Vercel 60초 제한에 근접할 수 있음 | 모니터링 필요 | Pro 플랜에서 maxDuration 증가 가능 |

---

## 파일 구조 (현재)

```
energy-project-intel/
├── index.html            ← 메인 검색 + 대시보드 페이지
├── list.html             ← 글로벌 프로젝트 목록 페이지
├── app.js                ← 프론트엔드 로직 (검색, 대시보드, 자동완성)
├── style.css             ← 전체 스타일시트
├── projects.js           ← 공유 스토리지 + Fuse.js 유틸리티
├── initial-projects.js   ← 초기 프로젝트 데이터 130개
├── api/
│   ├── search.js         ← AI 프로젝트 검색 서버리스 함수
│   └── update-list.js    ← AI 목록 업데이트 서버리스 함수
├── package.json
├── vercel.json
├── .gitignore
├── BRD.md
├── PRD.md
└── History.md
```

---

*본 문서는 Energy Project Intelligence Platform의 개발 이력을 역순(최신 → 과거)으로 기록한다.*
