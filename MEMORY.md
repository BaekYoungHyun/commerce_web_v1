# Commerce 프로젝트 메모

> 이 문서는 `AGENTS.md`에 따라 프로젝트의 방향, 현재 상태, 작업 이력, API 연동 정보를 지속적으로 기록한다. 이후 작업을 시작하기 전에 항상 확인하고, 변경 사항이 생기면 함께 갱신한다.

## 1. 서비스 정의

- 도매 공급자와 셀러(소매 사업자)가 거래하는 B2B 커머스 서비스다.
- 도매 공급자는 상품을 등록하고 관리할 수 있어야 한다.
- 셀러는 도매 공급자가 등록한 상품을 탐색하고 구매할 수 있어야 한다.
- 필수 업무 범위는 로그인, 회원 관리, 상품 관리, 구매 기능이다.
- UI 문구와 사용자 흐름은 일반 소비자용 쇼핑몰보다 도매 거래, 공급가, 최소 주문 수량, 재고, 사업자 회원 구분 등 B2B 맥락을 우선한다.

## 2. 핵심 사용자와 주요 기능

### 도매 공급자

- 로그인 및 공급자 회원/사업자 정보 관리
- 상품 등록, 수정, 판매 상태 및 재고 관리
- 주문 확인과 처리

### 셀러

- 로그인 및 셀러 회원/사업자 정보 관리
- 도매 상품 검색과 상세 정보 확인
- 상품 주문, 결제 및 구매 내역 확인

### 공통

- 역할별 권한과 화면 분리
- 상품, 주문, 회원 상태에 대한 명확한 피드백

## 3. 현재 기술 구성

- Vue 3 + TypeScript + Vite
- Vue Router 5
- Pinia 3
- 스타일: 전역 CSS (`src/assets/main.css`, `src/assets/base.css`)
- 테스트: Vitest, Vue Test Utils
- 코드 검사: vue-tsc, ESLint, Oxlint, Prettier
- 요구 Node.js 버전: `^22.18.0` 또는 `>=24.12.0`

## 4. 현재 구현 상태

- `App.vue`는 공통 헤더·푸터와 `<RouterView>`를 제공하는 앱 셸로 전환했다.
- `/`: 셀러용 도매 상품 탐색 홈이다. 카테고리/검색 필터, 공급가, 권장 판매가, 최소 주문 수량, 출고 정보와 로컬 장바구니 동작이 있다.
- `/login`: 사용자 ID와 비밀번호로 실제 로그인 API를 호출한다. 로그인 실패 업무 코드별 안내, 중복 제출 방지, 로그인 성공 후 사용자 정보 조회와 홈 이동이 동작한다.
- `/signup`: 사용자 ID, 비밀번호, 이름, 휴대폰 번호를 입력하는 회원가입 화면이다. 필수값·최대 길이 검증, ID 중복 오류 표시, 가입 성공 후 로그인 화면 이동이 동작한다.
- `/cart`: 셀러용 장바구니다. 도매처별 상품 묶음, 선택/삭제, 최소 주문 및 재고 범위 내 수량 변경, 도매처별 배송비와 결제 예정 금액 계산이 동작한다.
- `/categories`: 전체 카테고리 탐색 화면이다. 분류별 현재 상품 수를 표시한다.
- `/categories/:category`: 카테고리별 상품 목록이다. 카테고리 이동, 내부 검색, 추천/공급가/마진 정렬을 지원한다.
- `/products/:id`: 셀러용 상품 상세다. 상단 썸네일 갤러리와 하단 세로형 상세 이미지 영역, 공급가·권장 판매가·예상 마진, 거래 조건, 색상, 주문 수량 및 총액을 확인하고 로컬 장바구니에 담을 수 있다.
- `/supplier/products`: 이전 도매 상품관리 주소이며 `/admin/supplier/products`로 이동한다.
- `/admin/supplier/products`: 실제 상품 목록 API를 사용한다. 서버 페이지 이동과 도매상 ID·카테고리 ID·상태·상품명 검색을 지원한다.
- `/admin/supplier/products/new`: 실제 상품 등록 API를 사용한다. 도매상 ID, 카테고리 ID, 상품명, 설명, 상태, 최소 주문 수량을 입력한다.
- `/admin/supplier/products/:id`: 실제 상품 상세 API를 다시 호출해 서버의 최신 상품 정보를 표시한다.
- `/admin/supplier/products/:id/edit`: 상세 API로 기존 값을 불러온 후 실제 상품 수정 API에 `PUT` 요청한다.
- `/admin/seller/products`: 셀러 관리자 상품관리다. 소싱 상품의 도매처, 공급가, 권장 판매가, 재고, 최소 주문 수량과 판매 상태를 확인하고 관리할 수 있다.
- `/admin/seller/products/:id`: 셀러 관리자에서 소싱 상품의 상세 정보와 거래 조건을 읽기 전용 중심으로 확인한다.
- 관리자 상품 목록·상세·등록·수정은 `src/services/productApi.ts`와 `src/stores/adminProducts.ts`를 통해 백엔드 API에 연결된다.
- 관리자 화면은 `docs/관리자화면.png`를 참고한 어두운 좌측 메뉴, 역할 전환, 상단 계정 영역, 조건 검색과 밀도 높은 표 구조이며 모바일에서는 슬라이드 메뉴와 가로 스크롤 표를 사용한다.
- 서비스 공통 헤더의 `관리자`, `관리자 센터` 링크에서 도매 관리자 상품관리로 진입할 수 있다.
- 목록과 상세가 공유하는 샘플 상품은 `src/data/products.ts`, 카테고리 메타 정보는 `src/data/categories.ts`에서 관리한다.
- 상품·카테고리는 현재 프론트엔드 샘플 데이터이며, 장바구니는 API와 동일한 인터페이스의 메모리 목업을 사용해 새로고침하면 초기화된다.
- 상품 목록은 넓은 데스크톱 5열, 중간 화면 3열, 태블릿·모바일 2열이며 모든 이미지는 동일한 세로형 비율을 사용한다.
- 아우터, 상의, 팬츠, 원피스, 가방, 슈즈 카테고리마다 샘플 상품이 20개씩 총 120개 있다.
- 기본 Vue 템플릿 파일(`AboutView.vue`, `TheWelcome.vue` 등)이 일부 남아 있지만 현재 라우트에서는 사용하지 않는다.

## 5. API 및 환경설정

### 환경 변수 이름

- API 연동의 우선 참조 문서는 `docs/frontend-api-guide.md`다.
- 실제 환경의 API 기본 URL은 `VITE_API_URL`이며 `/api/v1`까지 포함한다. 예: `http://localhost:8050/api/v1`.
- 공통 `.env`
  - `VITE_REGISTRATION_CERTIFICATE_KEY`: 사업자 관련 인증 키로 추정되며 실제 용도 확인 필요
  - `VITE_KOREA_EXPORT_IMPORT_BANK_API_KEY`: 한국수출입은행 API 키
- 개발/스테이징/운영 환경
  - `VITE_API_URL`: `/api/v1`을 포함한 백엔드 API 기본 URL
  - `VITE_IMAGE_URL`: 이미지 서버 기본 URL
  - `VITE_MODE`: 실행 환경 식별값
  - `VITE_URL`: 프론트엔드 또는 서비스 URL
  - `VITE_USE_MOCK_API`: `true`면 메모리 목업, `false`면 실제 API 사용. 미설정 시 현재는 `true`

### 공통 HTTP 클라이언트

- `src/services/httpClient.ts`는 `VITE_API_URL`을 우선 사용하고 `VITE_API_BASE_URL`은 호환용 대체 값으로만 사용한다.
- 환경 변수에 `/api/v1`이 이미 있으므로 각 API 서비스는 `/users`, `/products`, `/cart`처럼 버전 prefix 없는 리소스 경로만 전달한다. `/api/v1` 또는 `/v1`을 서비스 파일에서 다시 붙이지 않는다.
- 공통 클라이언트가 Base URL 끝의 `/`와 요청 경로 앞의 `/`를 정규화해 슬래시를 한 번만 사용한다.
- JSON 요청과 정상·예외 응답 타입, HTTP 오류의 상태·업무 코드·메시지를 보존하는 `ApiError` 변환을 공통 처리한다.
- 사용자 인증은 로그인 응답의 access token을 `Authorization: Bearer {accessToken}` 헤더로 전달한다.
- 토큰 저장 정책이 미확정이므로 현재 Pinia 메모리에만 보관하며, 비밀번호·토큰·Authorization 헤더를 로그에 남기지 않는다. 새로고침 시 로그인 상태가 유지되지 않는 것은 현재 정책상 알려진 제한이다.

### 사용자·인증 API 계약

- 공통 경로: `/api/v1`
- 공통 정상 응답: `{ status, message, code, data, dataTime, httpStatus }`
- 예외 응답: `{ timestamp, status, error, code, message }`
- `POST /api/v1/users/sign`: 회원가입, 성공 `201`
- `POST /api/v1/users/login`: 로그인, 성공 `200`
- `GET /api/v1/users/info`: 현재 사용자 조회, Bearer 인증 필요
- `POST /api/v1/users/refresh-token`: 기존 access token으로 재발급
- `POST /api/v1/users/logout`: 로그아웃, Bearer 인증 필요
- `accessTokenExpiresIn`은 남은 시간이 아니라 Unix epoch millisecond 만료 시각이다.
- 날짜·시간은 UTC offset 없는 ISO-8601 문자열이며 `Asia/Seoul` 기준으로 취급한다.
- API 상세 필드, 오류 코드 및 미확정 정책은 구현 시 반드시 `docs/frontend-api-guide.md` 최신 내용을 다시 확인한다.

### 상품 API 계약

- 상품 API는 공통 `ApiResponse<T>` envelope를 사용하지 않고 응답 DTO를 직접 반환한다.
- `GET /api/v1/products`: 0부터 시작하는 서버 페이지 상품 목록. `page`, `size`, `wholesaleStoreId`, `categorySeq`, `status`, `name` 검색 조건을 지원하며 생성일 내림차순으로 정렬된다.
- `GET /api/v1/products/{productId}`: 상품 상세 조회. 없는 상품은 HTTP `404`, 코드 `P001`이다.
- `POST /api/v1/products`: 상품 등록. 성공 HTTP Status는 `201`이며 생성된 상품 DTO를 직접 반환한다.
- `PUT /api/v1/products/{productId}`: 상품 전체 수정. 상품 필드와 `images`, `options`, `variants` 배열 전체를 전송하고, 기존 하위 행의 `seq`를 유지해야 한다. 응답에 있었지만 요청에서 빠진 하위 행은 삭제된다.
- 상품 모델은 기본 필드 `seq`, `wholesaleStoreId`, `categorySeq`, `name`, `description`, `status`, `minOrderQuantity`, `createdAt`, `updatedAt`과 aggregate 필드 `images`, `options`, `variants`, `viewCount`를 포함한다.
- 등록·수정 요청의 `images`, `options`, `variants`는 필수 키이며 항목이 없어도 빈 배열을 전송한다. 등록 시 하위 `seq`는 전송하지 않고 수정 시 기존 행에만 전송한다.
- 상품 이미지에는 업로드 완료 URL을 전송하며 현재 `imageType`은 `DETAIL`, 대표 이미지는 `sortOrder: 0`인 첫 이미지다.
- SKU는 `sku`, 색상, 사이즈, 공급가, 판매가, 상태를 포함하며 기본 상태는 `ACTIVE`다. 판매 이력이 있는 SKU는 삭제보다 상태 변경을 우선한다.
- 상품 날짜·시간은 UTC offset이 포함된 ISO-8601 문자열이다.
- 상품 검증 오류는 `{ timestamp, code, message, errors: [{ field, message }] }`이며 화면에서 `errors[].field`를 해당 입력 필드에 연결한다.
- 상품 API의 상태 허용값은 아직 미확정이다. 일반 등록 기본값은 가이드의 `DRAFT`를 사용하되 화면에서 임의의 전체 상태 목록을 확정하지 않는다.
- 현재 상품 API에는 별도 재고·배송 기준 필드는 없지만 이미지 URL, 옵션, SKU별 공급가·판매가·색상·사이즈 필드는 포함된다.

### 장바구니 API 계약(프론트엔드 가정)

- 서비스: `src/services/cartApi.ts`
- 상태 관리: `src/stores/cart.ts`
- 타입: `src/types/cart.ts`
- `GET /api/v1/cart`: 장바구니 목록 조회. 서비스 코드 경로는 `/cart`
- `POST /api/v1/cart/items`: `{ productId, optionName, quantity }` 상품 추가. 서비스 코드 경로는 `/cart/items`
- `PATCH /api/v1/cart/items/:cartItemId`: `{ quantity?, checked? }` 수량/선택 변경
- `DELETE /api/v1/cart/items`: `{ cartItemIds: number[] }` 복수 삭제
- 현재 각 변경 API가 갱신된 `CartItem[]` 전체를 반환한다고 가정한다.
- `CartItem` 응답에는 상품 스냅샷(`productName`, `imageUrl`, `unitPrice`, `retailPrice`), 도매처 정보, 옵션, 최소 주문, 재고, 배송비와 무료배송 기준이 포함되어야 한다.
- 실제 API가 `{ data, message }` 같은 응답 envelope를 사용하면 `cartApi.ts`에서만 변환하고 스토어와 화면 타입은 유지한다.
- 장바구니 가격과 배송비의 최종 검증 및 주문 금액 확정은 반드시 서버에서 수행해야 한다.

### 현재 연동 상태

- 회원가입, 로그인, 현재 사용자 조회, 토큰 재발급, 로그아웃은 `src/services/authApi.ts`와 `src/stores/auth.ts`를 통해 실제 API에 연결되어 있다.
- 로그인 실패 코드 `2000`, `2047`, `2048`과 회원가입 오류 코드 `DUPLICATE_USER`, `INVALID_VALUE_REQUEST`, `REQUIRED_DATA_NOT_FOUND`를 화면 상태에 반영한다.
- 동시 토큰 재발급 요청은 Pinia 스토어의 단일 Promise를 공유하며, 사용자 조회가 `401`이면 한 번 재발급 후 재시도한다.
- 장바구니는 API 서비스와 Pinia 스토어가 분리되어 있으며 `VITE_USE_MOCK_API=false`로 실제 API 어댑터를 선택할 수 있다.
- API 명세와 서버가 아직 제공되지 않아 기본값은 메모리 목업이다.
- 관리자 상품 목록·상세·등록·수정은 실제 API로 전환했다. 상품 API의 응답 DTO 직접 반환 방식과 전용 오류 구조를 반영했다.
- 상품 요청은 Bearer 인증을 사용하며 `401`이면 access token 재발급 후 한 번 재시도한다. 인증 복구 실패 시 로그인으로 이동하고 로그인 성공 후 기존 관리자 주소로 복귀한다.
- 서비스 홈 상품·카테고리와 장바구니는 아직 샘플 또는 목업 데이터이며 관리자 상품 API와 연결되지 않았다.
- `TheWelcome.vue`의 `fetch('/__open-in-editor?...')`는 Vite 개발용 템플릿 기능이며 서비스 API가 아니다.
- 사용자 인증 외 API의 경로, 요청/응답 타입, 오류 규격은 아직 코드에서 확인되지 않는다.
- 환경 변수의 실제 값과 API 키는 이 문서에 기록하지 않는다. 키가 프론트엔드 번들에 포함되어도 되는 공개 키인지 반드시 확인해야 한다.

## 6. 실행 및 검증 명령

- 개발 서버: `npm run dev`
- 스테이징 모드: `npm run stg`
- 운영 모드: `npm run prod`
- 기본 빌드 및 타입 검사: `npm run build`
- 환경별 빌드: `npm run build-dev`, `npm run build-stg`, `npm run build-prod`
- 테스트: `npm run test`
- 린트: `npm run lint`
- 포맷: `npm run format`

## 7. 다음 작업 우선순위

1. 도매 공급자와 셀러의 가입/인증 세부 정책 확정
2. API 명세를 확인하고 공통 API 클라이언트, 인증 및 오류 처리 구성
3. 현재 로컬 상품·장바구니 데이터를 실제 API와 Pinia 스토어로 전환
4. 상품 이미지 업로드와 수정/삭제 기능 추가
5. 셀러용 장바구니 상세, 주문/결제 및 구매 내역 구현
6. 도매용 주문 확인/처리 화면 구현
7. 핵심 사용자 흐름에 대한 단위 및 통합 테스트 추가

## 8. 작업 이력

### 2026-07-21

- 메인 히어로와 상품 이미지 영역 확대
- 상품 카드 정보와 인터랙션의 가독성 개선
- 상품 이미지를 고해상도 URL로 변경
- 반응형 상품 그리드 조정
- `npm run build` 및 타입 검사 통과

### 2026-07-22

- `AGENTS.md`의 서비스 요구사항을 재정리
- 프로젝트 구조와 API 연동 현황 확인
- 최초 `MEMORY.md` 작성
- 공통 앱 셸과 기능별 라우트 구조로 전환
- 셀러용 B2B 상품 홈, 역할별 로그인 화면, 도매 상품관리 화면 구현
- 공급가, 권장 판매가, 최소 주문 수량, 사업자 인증 등 B2B 거래 정보 반영
- 상품 검색/카테고리 필터, 최소 수량 장바구니, 상품 등록 및 판매 상태 변경 구현
- 상품 클릭형 상세페이지와 수량/옵션/총액/장바구니 흐름 구현
- 전체 카테고리와 카테고리별 상품 목록, 검색 및 정렬 구현
- 목록·상세 공용 상품 데이터와 카테고리 데이터를 별도 모듈로 분리
- 상품 목록을 데스크톱 5열로 확장하고 카테고리별 샘플 상품을 20개씩 구성
- 카테고리별 상품 수와 상품 ID 중복 여부를 검증하는 데이터 테스트 추가
- 모든 상품에 4장의 상세 이미지를 구성하고 썸네일 선택형 이미지 갤러리 추가
- 상세 정보 아래에 4장의 상품 이미지를 크게 이어서 보여주는 세로형 상세 영역 추가
- `npm run build`, 타입 검사 및 `npm run test` 통과

### 2026-07-23

- 셀러용 장바구니 화면과 `/cart` 라우트 구현
- 목록/상세의 장바구니 담기를 전역 Pinia 장바구니 스토어에 연결
- 장바구니 조회, 추가, 수량/선택 변경, 삭제 API 인터페이스와 목업/실 API 어댑터 구현
- 도매처별 배송비, 선택 상품 금액과 결제 예정 금액 계산 구현
- 공통 HTTP 클라이언트와 장바구니 API DTO 및 예상 엔드포인트 문서화

### 2026-07-24

- 모든 API 적용 전에 `docs/frontend-api-guide.md`를 우선 참고하는 작업 규칙 추가
- 현재 사용자·인증 API의 Base URL, Bearer 토큰, 공통 응답, 만료 시각 및 날짜 처리 계약을 메모에 반영
- 기존 `VITE_API_URL` 및 쿠키 인증 가정과 최신 백엔드 가이드의 차이를 기록
- 회원가입·로그인 화면을 실제 `/api/v1/users/sign`, `/api/v1/users/login` API에 연결
- 현재 사용자 조회, access token 단일 재발급, 로그아웃 API와 Pinia 인증 스토어 구현
- 공통 HTTP 클라이언트에 `VITE_API_BASE_URL`, 정상 응답 envelope와 업무 오류 코드 처리 반영
- 회원가입 입력 검증, ID 중복 오류, 로그인 실패 업무 코드별 안내 및 요청 중 중복 제출 방지 구현
- 보안 정책 미확정에 따라 access token을 영구 저장소가 아닌 메모리에만 보관
- 인증 API 단위 테스트 3개 추가
- `npm run build`, `npm run test`(총 7개), `npm run lint` 통과

### 2026-07-25

- `docs/관리자화면.png`를 참고해 서비스 화면과 분리된 관리자 공통 레이아웃 구현
- `/admin/supplier/products`, `/admin/seller/products` 역할별 상품관리 경로 추가
- 도매·셀러 관리자 전환, 좌측 업무 메뉴, 상단 계정 영역과 서비스 화면 복귀 링크 구현
- 상품 현황 요약, 카테고리·상태·키워드 필터, 선택, 페이지 이동과 다운로드 UI 구현
- 도매 상품 등록 모달, 판매 상태 변경과 재고 주의 표시를 로컬 상태로 구현
- 셀러 상품관리에서 도매처·공급가·권장 판매가·재고·최소 주문 정보 제공
- 기존 `/supplier/products`를 새 도매 관리자 상품관리 주소로 리다이렉트
- 서비스 상단 내비게이션에 관리자 진입 링크 배치
- 관리자 상품 API 계약 미확정으로 실제 API를 임의 적용하지 않고 로컬 데이터 사용 사실 기록
- `npm run build`, `npm run test`(총 7개), `npm run lint` 통과
- 도매 관리자 상품 상세, 신규 등록, 수정 전용 페이지와 라우트 구현
- 상품 목록의 상품명·수정 버튼을 상세·수정 페이지에 연결하고 셀러 상품 상세 경로 추가
- 관리자 상품 데이터 타입과 공유 Pinia 스토어를 도입해 목록·상세·등록·수정·상태 변경 간 데이터 연결
- 상품 이미지 갤러리, 공급가·권장 판매가·마진율, 재고·최소 주문·색상·배송·설명 정보 제공
- 상품 폼에 가격 관계, 필수값, 색상 옵션 검증과 대표·상세 이미지 URL 미리보기 구현
- 상품 API 미확정에 따라 새로고침 시 초기화되는 로컬 상태와 이미지 URL 입력 방식임을 화면에 안내
- 관리자 상품 스토어 등록·수정·상태 변경 단위 테스트 2개 추가
- `npm run build`, `npm run test`(총 9개), `npm run lint` 통과

### 2026-07-26

- `docs/frontend-api-guide.md`의 최신 상품 목록·상세·등록·수정 계약 확인
- `src/services/productApi.ts`에 Bearer 인증 기반 상품 목록, 상세, POST 등록, PUT 수정 API 구현
- 관리자 상품 Pinia 스토어를 로컬 샘플 데이터에서 실제 API 비동기 상태로 전환
- 상품 목록에 서버 페이지, 도매상 ID·카테고리 ID·상태·상품명 검색과 로딩·빈 결과·오류 상태 연결
- 상품 상세·수정 화면 진입 시 상세 API를 다시 호출하도록 변경
- 상품 등록·수정 요청 중 저장 버튼 비활성화와 서버 `errors[].field` 입력 오류 연결
- 상품 API에 없는 가격·재고·이미지·색상·배송 필드를 요청 및 관리자 편집 화면에서 제거
- HTTP `401` 재발급·재시도 및 로그인 복귀 경로, `403` 권한 안내, `404/P001` 목록 이동 처리
- 상품 API 서비스 테스트 3개와 관리자 상품 스토어 테스트 2개 구성
- `npm run build`, `npm run test`(총 12개), `npm run lint` 통과

- 모든 환경의 `VITE_API_URL`이 `/api/v1`을 포함하는 구성임을 확인
- 인증·상품·장바구니를 포함한 전체 `apiRequest` 호출 경로 전수 점검
- 상품 서비스의 중복 `/api/v1`과 장바구니 서비스의 중복 `/v1` prefix 제거
- 공통 HTTP 클라이언트에서 `VITE_API_URL` 우선순위 및 Base URL·리소스 경로 슬래시 정규화 적용
- 인증 `/users/*`, 상품 `/products/*`, 장바구니 `/cart/*` 리소스 경로 규칙으로 통일
- 최종 URL에 `/api/v1/api/v1`이 생성되지 않는 회귀 테스트 추가
- `npm run build`, `npm run test`(총 12개), `npm run lint` 통과

### 2026-07-28

- `docs/frontend-api-guide.md` 최종 갱신일 2026-07-28의 상품 aggregate 계약을 우선 참조해 연동 수정
- 상품 목록 검색 키와 응답 필드를 `categoryId`에서 `categorySeq`로 변경
- 상품 목록·상세 응답 타입에 `images`, `options`, `variants`, `viewCount` 반영
- 상품 등록·수정 요청에 필수 배열 `images`, `options`, `variants` 추가
- 수정 폼에서 기존 이미지·옵션·SKU의 `seq`를 유지하고 추가·제거·수정할 수 있도록 변경
- 상세 화면에서 조회수와 이미지·옵션·SKU 및 SKU별 공급가·판매가 표시
- `categorySeq` 쿼리와 aggregate 전체 수정 payload 회귀 테스트 보강
- `npm run build`, `npm run test`(총 13개), `npm run lint` 통과

## 9. 유지 규칙

- 모든 작업 전 `AGENTS.md`, 이 문서, API 작업 시 `docs/frontend-api-guide.md`를 확인한다.
- 기능, 구조, API, 환경 변수 이름, 주요 결정 또는 검증 결과가 바뀌면 이 문서를 갱신한다.
- 비밀번호, 토큰, API 키, 환경 변수 실제 값 등 비밀 정보는 기록하지 않는다.
- 완료되지 않은 기능을 완료된 것으로 기록하지 않는다.
