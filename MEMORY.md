# Commerce 프로젝트 메모

> 이 문서는 `AGENTS.md`에 따라 프로젝트의 방향, 현재 상태, 작업 이력, API 연동 정보를 지속적으로 기록한다. 이후 작업을 시작하기 전에 항상 확인하고, 변경 사항이 생기면 함께 갱신한다.

- API 연동의 확정 계약은 `docs/frontend-api-guide.md`를 우선 참조한다.
- `docs/frontend-api-guide.md`의 현재 최신 확정 계약일은 2026-08-24이며, 상단 최종 갱신일과 변경 이력을 일치시켰다. (2026-08-24 확인)
- 2026-08-24 재검증에서 관리자 사용자 목록 설명의 기존 배열 표현을 공통 `PageResponse<AdminUser>` 계약으로 바로잡았으며, 현재 서비스·스토어의 페이지 응답 처리와 일치함을 확인했다.
- 2026-08-24 도매 주문 확정 계약에 맞춰 주문 품목 옵션을 `sku`, `color`, `size` 고정 필드로 전환하고, 소매 매장명 `retailStoreName`과 구매처 상호 `buyerCompanyName`을 화면에 표시한다. 레거시 `CREATED`는 서버가 `PRODUCT_ORDERED`로 정규화하므로 프론트 호환 분기를 제거했으며, 품목 상태 변경 성공 시 응답의 전체 `WholesaleOrder`로 대상 주문을 교체한다.
- 2026-08-24 목록 API 계약 변경에 따라 셀러·서비스 관리자 주문, 도매 주문·출고, 관리자 사용자·사업자·매장·택배사, 도매 재고·입고 목록을 공통 `PageResponse<T>`로 전환했다. 각 스토어는 `content`와 페이지 메타데이터를 분리해 보관하고 화면은 이전·다음 페이지와 전체 건수를 표시한다. 검색·필터를 새로 적용하면 0페이지부터 조회하며 카테고리·장바구니·소유 매장·활성 택배사 select 배열 계약은 유지한다.
- API 작업 중 추가로 필요한 필드, 상태 전이, 권한, 검증 로직은 `docs/api-guide.md`에 요청 사항과 임시 처리를 기록한다.
- 해당 계약이 확정되면 `docs/frontend-api-guide.md`와 구현을 갱신하고 `docs/api-guide.md` 항목을 `해결`로 변경한다.

## 1. 서비스 정의

- 도매 공급자와 셀러(소매 사업자)가 거래하는 B2B 커머스 서비스다.
- 도매 공급자는 상품을 등록하고 관리할 수 있어야 한다.
- 셀러는 도매 공급자가 등록한 상품을 탐색하고 구매할 수 있어야 한다.
- 필수 업무 범위는 로그인, 회원 관리, 상품 관리, 구매 기능이다.
- UI 문구와 사용자 흐름은 일반 소비자용 쇼핑몰보다 도매 거래, 공급가, 최소 주문 수량, 재고, 사업자 회원 구분 등 B2B 맥락을 우선한다.

## 2. 핵심 사용자와 주요 기능

- 관리자 센터는 `도매`, `셀러`, `ADMIN`의 세 역할 영역으로 구분한다. 업무 화면은 담당 역할 메뉴와 경로 아래에 배치한다.

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
- 요구 Node.js 버전: `24.x`. Vercel에서 향후 새 메이저 버전으로 자동 상승하지 않도록 24 계열로 고정한다. (2026-09-04, `COMMERCE_VercelNodeVersion_001`)

## 4. 현재 구현 상태

- `App.vue`는 공통 헤더·푸터와 `<RouterView>`를 제공하는 앱 셸로 전환했다.
- `/`: 셀러용 도매 상품 탐색 홈이다. 카테고리/검색 필터, 공급가, 권장 판매가, 최소 주문 수량, 출고 정보와 로컬 장바구니 동작이 있다.
- 메인 도매 상품 목록 위 카테고리 필터는 카테고리 트리에서 `parentSeq === null`인 1뎁스만 노출한다. 1뎁스 선택 시 상품 API가 해당 카테고리와 하위 카테고리 상품을 함께 조회한다. (2026-08-20)
- `/login`: 사용자 ID와 비밀번호로 실제 로그인 API를 호출한다. 로그인 실패 업무 코드별 안내, 중복 제출 방지, 로그인 성공 후 사용자 정보 조회와 홈 이동이 동작한다.
- 로그인 화면의 `아이디 기억하기`를 선택하면 로그인 성공 시 사용자 ID만 `localStorage`에 저장해 다음 방문에 자동 입력한다. 비밀번호와 토큰은 이 기능으로 저장하지 않는다. (2026-08-19)
- 로그인 응답의 `landingPage`를 우선 사용해 `WHOLESALE_ADMIN`은 `/admin/supplier/products`, `SERVICE_MAIN`은 `/`, `ADMIN_HOME`은 `/admin/business-profiles`로 이동한다. `roles`와 `adminScopes`는 관리자 역할·메뉴·경로 접근에 사용하고 세션 동안 보관한다. 현재 사용자 `businessType`은 `WHOLESALE | RETAIL` 계약을 따른다. (2026-08-19)
- `/signup`: 사용자 ID, 비밀번호, 이름, 휴대폰 번호를 입력하는 회원가입 화면이다. 필수값·최대 길이 검증, ID 중복 오류 표시, 가입 성공 후 로그인 화면 이동이 동작한다.
- 회원가입은 API 필수 계약에 따라 사업자 유형 `RETAIL`(셀러) 또는 `WHOLESALE`(도매)을 선택해 `businessType`으로 전송한다. (2026-08-19)
- `/cart`: 실제 장바구니 API를 사용하는 셀러용 장바구니다. 로그인 사용자 기준 목록, 주문자 사업자 정보, 도매처별 상품 그룹·소계, 상품 선택, 개별/선택 삭제, 1개 이상 수량 변경과 서버 계산 전체 금액 표시가 동작한다. 장바구니 행은 최초 상품 추가 시 서버가 생성한다.
- 장바구니 `buyer`의 소매 사업자·매장 관련 필드는 nullable이다. 소매 매장이 없는 사용자는 장바구니 조회·표시는 가능하지만 대체 문구를 표시하고 주문 버튼을 비활성화한다. (2026-08-20)
- `/orders`: 로그인 사용자의 전체 소매 매장 주문 목록이며 `/orders/:id`에서 주문·품목·금액 상세를 조회한다.
- 셀러 주문 목록과 상세는 주문 응답의 `shipments`를 사용해 도매 매장별 출고 준비·완료 상태, 택배사, 송장번호, 출고일과 출고 수량을 표시한다. 출고 생성 전에는 준비 전 안내를 표시하고 분할 출고는 각각 별도 항목으로 노출한다. (2026-08-24)
- `/admin/orders`: 서비스 관리자 전체 주문 목록이다.
- `/admin/supplier/orders`: `GET /wholesale/orders`를 사용해 로그인 사용자의 도매 매장 주문 상품만 조회하고, 도매 매장·상품 상태 필터와 `PRODUCT_ORDERED` → `PRODUCT_PREPARING` → `PRODUCT_READY` 상태 변경을 제공한다.
- 도매 주문 목록은 여러 업체 상품이 포함된 주문도 로그인 사용자가 소유한 도매 매장 품목만 응답받으며, 다른 업체 매장 조회·상태 변경은 서버가 제한한다. 화면의 매장 필터에도 소유 매장 범위임을 명시한다. (2026-08-20)
- 도매 주문·출고 화면의 매장 필터는 `GET /wholesale/stores`에서 로그인 사용자가 소유한 매장 목록을 조회해 매장명과 ID를 select로 표시한다. 매장 ID 직접 입력은 제거했으며 선택한 매장의 `seq`만 검색 query로 전송한다. (2026-08-24, 가이드 계약일 2026-08-21)
- 2026-08-21 확인 결과 `/wholesale/orders`에서 비소유로 보이는 여러 도매 매장이 노출되는 현상이 보고됐다. 응답만으로 소유 여부를 판별할 수 없어 프론트 임의 필터는 적용하지 않았으며, 백엔드 소유권 제한 불일치를 `docs/api-guide.md` API-008에 기록했다.
- 2026-08-24 `docs/img.png`에서 YH 도매 연결 계정에 `도매 매장 1-2` 품목도 노출되는 현상을 재확인했다. 도매 주문·출고는 `/wholesale/stores`를 먼저 조회하고 해당 응답의 매장 ID에 속한 데이터만 표시하도록 방어 처리했다. `/wholesale/stores` 자체가 비소유 매장을 반환하면 프론트에서 실제 소유 관계를 판별할 수 없으므로 백엔드 수정이 필요하며 상세 확인 항목은 `docs/api-guide.md` API-008에 기록했다.
- 도매 주문 상태 `PRODUCT_ORDERED`의 화면 명칭은 `주문상품`으로 표시한다. 레거시 DB의 `CREATED`는 서버 응답에서 `PRODUCT_ORDERED`로 정규화된다.
- 도매 주문 품목 상태 PATCH 성공 응답은 전체 `WholesaleOrder`이며, 대상 주문을 응답 객체로 교체하되 `/wholesale/stores` 기준 소유 매장 품목 방어 필터는 유지한다.
- `/admin/supplier/shipments`: `GET /wholesale/shipments`를 사용하는 도매 출고 관리 화면으로, 도매 매장·출고 상태 필터, 출고 수량 변경, 활성 택배사 선택·송장 입력, `SHIPMENT_PREPARING` → `SHIPPED` 상태 변경을 제공한다.
- 출고 목록 응답이 상태에 반영되는 순간 편집 초안을 `flush: 'sync'` watcher로 동기 생성하고, 템플릿은 초안 존재를 확인한 후 렌더링해 `drafts[shipmentSeq].status` 접근 오류를 방지한다.
- 도매 주문관리와 출고관리는 전체 너비 카드, 상단 요약, 품목 테이블의 같은 UI 구조를 사용하며 출고 카드에만 상태·택배사·송장 편집 영역을 추가한다.
- 주문 목록 표는 `colgroup`으로 열 너비를 고정하고 상품 목록을 셀 너비 `100%`로 제한해, 공통 상품 표의 `nth-child` 너비와 충돌하며 상태 배지가 상품 카드 위로 겹치는 현상을 방지한다.
- 주문 목록의 주문일은 API ISO 일시를 한국 시간으로 변환해 `YYYY-MM-DD HH:mm:ss` 형식으로 표시한다.
- `/admin/supplier/inventory`: 도매 관리자 SKU 재고 목록이며 등록·수정 페이지와 상품 SKU 선택 팝업을 제공한다. 기존 `/admin/inventory`는 이 주소로 이동한다.
- `/admin/supplier/inventory/bulk`: 기존 재고 여러 건 수정과 신규 SKU 재고 등록을 한 트랜잭션으로 처리하는 도매 재고 일괄 관리 페이지다.
- 도매 재고 목록 상단의 `재고 일괄 관리` 버튼과 도매 메뉴에서 벌크 페이지로 진입할 수 있다.
- `/admin/supplier/stock-receipts`: 도매상품 입고 목록이며 등록·수정 페이지와 상품 SKU 선택 팝업을 제공한다. 입고 상태는 `REGISTERED` → `EXPECTED` → `COMPLETED` 순서로만 변경하고 완료 건은 보기 전용으로 잠근다.
- `/categories`: 전체 카테고리 탐색 화면이다. 분류별 현재 상품 수를 표시한다.
- `/categories/:category`: 카테고리별 상품 목록이다. 카테고리 이동, 내부 검색, 추천/공급가/마진 정렬을 지원한다.
- `/products/:id`: 실제 상품 상세 API를 사용하는 셀러용 상품 상세다. 이미지 갤러리, 카테고리명, 설명, 옵션, 판매 가능한 SKU, SKU별 공급가·판매가·예상 마진, 최소 주문 수량과 조회수를 표시하고 선택한 SKU로 장바구니에 담는다.
- 서비스 홈·카테고리 상품 목록 카드와 상품 상세는 `wholesaleStoreName`만 표시하고 도매상 ID는 노출하지 않는다. 매장명이 `null`이면 대체 문구를 표시한다. 관리자 상품 화면에서는 ID와 매장명을 모두 유지한다. (2026-08-20)
- `/supplier/products`: 이전 도매 상품관리 주소이며 `/admin/supplier/products`로 이동한다.
- `/admin/supplier/products`: 실제 상품 목록 API를 사용한다. 서버 페이지 이동과 도매상 ID·카테고리 ID·상태·상품명 검색을 지원하며 `images[0]`을 대표 이미지로 표시한다.
- 도매 상품 관리 목록과 상품 상세는 `도매상` 한 필드 안에 `wholesaleStoreName`을 강조하고 `wholesaleStoreSeq`를 보조 정보로 함께 표시한다. 매장명이 `null`이면 대체 문구를 표시한다. (2026-08-19)
- `/admin/supplier/products/new`: 실제 상품 등록 API를 사용한다. 기본 정보와 이미지·옵션·SKU를 행 단위로 추가해 입력한다.
- `/admin/supplier/products/:id`: 실제 상품 상세 API를 다시 호출해 기본 정보, 이미지 갤러리, 설명, 옵션, SKU별 가격·예상 마진을 표시한다.
- `/admin/supplier/products/:id/edit`: 상세 API로 기존 값을 불러온 후 이미지·옵션·SKU의 기존 `seq`를 유지하며 행 단위로 효율적으로 수정하고 실제 상품 수정 API에 `PUT` 요청한다.
- `/admin/seller/products`: 셀러 관리자 상품관리다. 소싱 상품의 도매처, 공급가, 권장 판매가, 재고, 최소 주문 수량과 판매 상태를 확인하고 관리할 수 있다.
- `/admin/seller/products/:id`: 셀러 관리자에서 소싱 상품의 상세 정보와 거래 조건을 읽기 전용 중심으로 확인한다.
- 셀러 관리자 사이드바에서는 상품관리 메뉴를 제거하고 `/admin/seller/orders` 주문관리 메뉴를 제공한다. 주문 목록과 `/admin/seller/orders/:id` 상세는 셀러 주문 API의 상품 및 도매 출고·배송 진행 정보를 표시하며, 셀러 관리자 역할 전환과 기본 관리자 진입 경로도 주문관리로 연결한다. 기존 셀러 상품 URL은 메뉴에서만 제거하고 직접 접근 호환은 유지한다. (2026-08-24)
- 셀러 관리자 주문 목록은 상품 가독성을 우선한 주문별 카드 UI를 사용한다. 각 상품을 독립된 행으로 표시하고 상품명, 도매 매장, SKU·색상·사이즈, 단가, 수량, 상품 금액, 처리 상태를 함께 노출하며 주문 요약과 배송 현황은 별도 영역으로 분리한다. 일반 사용자·서비스 관리자 주문 목록의 기존 표 UI는 유지한다. (2026-08-24)
- 셀러 관리자 주문 카드 UI는 `docs/frontend-api-guide.md`의 `Order`, `OrderItem`, `SellerOrderShipment` 계약을 기준으로 구현했다. 계약에 없는 상품 이미지는 사용하지 않으며 상품 상태는 확정 명칭인 `상품주문`, `상품 준비중`, `상품 준비 완료`, 출고 상태는 `출고 준비중`, `출고 완료`로 표시한다. 확정 enum이 없는 주문 헤더 상태는 서버 값을 그대로 표시한다. (2026-08-24)
- 공통 `PageControls`를 사용하는 모든 목록은 페이지 번호를 최대 10개씩 노출하고 번호 클릭으로 바로 이동한다. 화면 번호는 1부터 표시하지만 `docs/frontend-api-guide.md`의 `PageResponse.page` 계약에 맞춰 API 요청에는 0 기반 인덱스를 유지하며, 10페이지를 넘으면 현재 페이지가 속한 10개 단위 묶음을 표시한다. (2026-08-24)
- 공통 목록 페이징 디자인은 `docs/img.png`를 참고해 테두리형 이전·다음 버튼, 테두리 없는 숫자, 굵은 현재 페이지, 페이지 크기 선택과 전체 건수 구조로 구성한다. `docs/frontend-api-guide.md`의 목록 `size` 계약(기본 20, 최대 100)에 맞춰 10·20·30·50·100개 선택을 실제 API query에 반영하고, 크기를 바꾸면 첫 페이지부터 조회한다. (2026-08-24)
- 2026-08-25 전체 목록 재점검에서 별도 이전·다음 UI를 사용하던 관리자 상품, 홈 도매 상품, 카테고리 상품 목록도 공통 `PageControls`로 통합했다. 상품 API의 확정 `page`·`size` 계약에 따라 페이지 번호와 페이지 크기 선택을 실제 조회 query에 반영한다.
- 2026-08-25 `docs/frontend-api-guide.md` 14장의 공통 문의·알림 계약을 구현했다. 셀러·도매 관리자에 문의 목록·등록(`/support/inquiries`)과 알림 목록·읽음 처리(`/notifications`) 화면, 서비스·스토어·타입·라우트를 추가했다. 양쪽 메뉴는 가이드 권장 순서로 재구성하고 API가 없는 후속 기능은 비활성 항목으로 표시한다.
- 2026-08-25 셀러 서비스와 관리자 업무 화면을 분리했다. 셀러 관리자 전용 상품 탐색 `/admin/seller/products`, 상품 상세 `/admin/seller/products/:id`, 장바구니 `/admin/seller/cart`를 구성하고 상품 탐색→상세→장바구니→관리자 주문 상세 흐름이 서비스 경로(`/`, `/products/:id`, `/cart`, `/orders/:id`)로 이탈하지 않도록 경로를 분리했다. 상품·장바구니 API 계약과 Pinia 상태는 공통으로 재사용한다.
- 셀러 관리자 상품 탐색은 `SellerProductBrowseView`, 장바구니 진입은 `SellerAdminCartView` 전용 화면 컴포넌트를 사용한다. 장바구니 DTO와 CRUD·주문 로직은 `docs/frontend-api-guide.md`의 로그인 사용자 단일 계약이므로 서비스 화면과 공통 `CartView` 내부 구현 및 스토어를 재사용하되, 관리자 라우트·레이아웃·상세 이동 경로는 분리한다. (2026-08-25)
- 2026-08-25 가이드 14.1 추가 계약에 따라 셀러 대시보드, 배송지 CRUD, 결제 목록·환불 요청 API와 관리자 화면을 구현했다. 응답 DTO가 누락된 찜 목록과 사업자·매장 조회는 API 함수만 준비하고 필요한 필드를 `docs/api-guide.md` API-009에 기록했으며 계약 확정 전까지 메뉴를 비활성으로 유지한다.
- 장바구니 주문 생성은 2026-08-24 확정 계약대로 도매 매장별 `Order[]` 응답을 처리한다. 한 도매처 주문이면 해당 주문 상세로, 여러 도매처 주문이면 셀러 관리자 또는 서비스 주문 목록으로 이동한다. (2026-08-25 반영)
- 2026-08-25 보완된 `SellerWishlist`, `SellerBusinessResponse` 계약에 따라 셀러 찜 목록·상품 상세 찜 추가·삭제와 사업자·연결 매장 조회 화면을 구현했다. API-009는 해결 처리했으며 DTO가 아직 없는 도매 관리 메뉴 API는 `docs/api-guide.md` API-010에 기록했다.
- 셀러 서비스 홈·카테고리 목록과 셀러 관리자 상품 탐색은 찜 목록의 `product_seq`와 상품 `seq`를 대조해 찜한 상품에 채워진 하트를 표시한다. 서비스·관리자 상품 상세는 현재 찜 여부를 표시하고 같은 버튼으로 찜 추가·해제를 처리한다. 도매 계정은 셀러 전용 찜 API를 호출하지 않는다. (2026-08-25)
- 2026-08-25 식별자 명명 규칙을 로그인 아이디 `userId` 예외 외에는 `*Seq`/`*_seq`로 통일했다. 상품 계약과 구현의 `wholesaleStoreId`는 `wholesaleStoreSeq`, 상품 경로 변수 `productId`는 `productSeq`로 변경했으며 최종 프론트 필드 매핑을 `docs/api-guide.md` API-011에 기록했다.
- 2026-08-25 도매 관리 계약 중 응답 필드가 확정된 대시보드(`/wholesale/management/dashboard`)를 구현하고 도매·셀러 대시보드 메뉴를 각 역할 경로로 바로잡았다. 도매 클레임·정산·거래처·사업자 화면은 API-010의 DTO 확정 후 구현한다.
- `/admin/business-profiles`: 서비스 관리자용 사업자 프로필 목록이며 등록·수정 전용 페이지를 제공한다.
- `/admin/users`: 서비스 관리자용 사용자 목록이며 사용자 등록·수정 페이지와 대표 사용자 선택 데이터로 사용한다.
- `/admin/wholesale-stores`: 서비스 관리자용 도매 매장 목록이며 사업자 프로필 ID 필터와 등록·수정 페이지를 제공한다.
- `/admin/retail-stores`: 서비스 관리자용 소매 매장 목록이며 사업자 프로필 ID 필터와 등록·수정 페이지를 제공한다.
- `/admin/delivery-companies`: 서비스 관리자용 택배사 목록이며 활성 상태·검색 필터와 등록·수정 페이지를 제공한다. 등록된 택배사 코드는 수정할 수 없고, 빈 배송조회 URL은 `null`로 전송한다.
- 관리자 상품 목록·상세·등록·수정은 `src/services/productApi.ts`와 `src/stores/adminProducts.ts`를 통해 백엔드 API에 연결된다.
- 관리자 화면은 `docs/관리자화면.png`를 참고한 어두운 좌측 메뉴, 역할 전환, 상단 계정 영역, 조건 검색과 밀도 높은 표 구조이며 모바일에서는 슬라이드 메뉴와 가로 스크롤 표를 사용한다.
- 관리자 상단에는 현재 로그인 사용자의 이름·아이디·역할을 표시하고, 로그아웃 API 호출 후 로그인 화면으로 이동하는 로그아웃 버튼을 제공한다. (2026-08-19)
- 서비스 공통 헤더의 `관리자`, `관리자 센터` 링크에서 도매 관리자 상품관리로 진입할 수 있다.
- 목록과 상세가 공유하는 샘플 상품은 `src/data/products.ts`, 카테고리 메타 정보는 `src/data/categories.ts`에서 관리한다.
- 장바구니는 `docs/frontend-api-guide.md`의 `Cart`/`CartItem` 응답을 그대로 사용하며 기존 메모리 목업과 임의 배송비·재고 데이터는 제거했다.
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

### 공통 HTTP 클라이언트

- `src/services/httpClient.ts`는 `VITE_API_URL`을 우선 사용하고 `VITE_API_BASE_URL`은 호환용 대체 값으로만 사용한다.
- 환경 변수에 `/api/v1`이 이미 있으므로 각 API 서비스는 `/users`, `/products`, `/cart`처럼 버전 prefix 없는 리소스 경로만 전달한다. `/api/v1` 또는 `/v1`을 서비스 파일에서 다시 붙이지 않는다.
- 공통 클라이언트가 Base URL 끝의 `/`와 요청 경로 앞의 `/`를 정규화해 슬래시를 한 번만 사용한다.
- JSON 요청과 정상·예외 응답 타입, HTTP 오류의 상태·업무 코드·메시지를 보존하는 `ApiError` 변환을 공통 처리한다.
- 사용자 인증은 로그인 응답의 access token을 `Authorization: Bearer {accessToken}` 헤더로 전달한다.
- access token과 epoch millisecond 만료 시각은 `sessionStorage`에 보관해 같은 브라우저 세션의 새로고침 동안 로그인을 유지한다. 브라우저 탭·창 종료 또는 로그아웃 시 제거하며 비밀번호·토큰·Authorization 헤더를 로그에 남기지 않는다.
- API 요청 전 만료 시각이 10초 이내이면 기존 access token으로 재발급하고, 여러 동시 요청은 하나의 재발급 Promise를 공유한다. 예상하지 못한 `401`도 한 번 재발급 후 원 요청을 재시도한다.
- `/admin/**` 전체 경로는 라우터 인증 가드로 보호한다. 세션 토큰이 없거나 만료 토큰 재발급에 실패하면 `/login?redirect={기존 관리자 주소}`로 이동한다.

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
- `GET /api/v1/products`: 0부터 시작하는 서버 페이지 상품 목록. `page`, `size`, `wholesaleStoreSeq`, `categorySeq`, `status`, `name` 검색 조건을 지원하며 생성일 내림차순으로 정렬된다.
- `GET /api/v1/products/{productSeq}`: 상품 상세 조회. 없는 상품은 HTTP `404`, 코드 `P001`이다.
- `POST /api/v1/products/{productSeq}/views`: 인증 사용자 상품 조회 로그 등록. 요청의 `userId`는 nullable이며 성공 후 상세를 다시 조회해 서버 집계 `viewCount`를 화면에 반영한다.
- `POST /api/v1/products`: 상품 등록. 성공 HTTP Status는 `201`이며 생성된 상품 DTO를 직접 반환한다.
- `PUT /api/v1/products/{productSeq}`: 상품 전체 수정. 상품 필드와 `images`, `options`, `variants` 배열 전체를 전송하고, 기존 하위 행의 `seq`를 유지해야 한다. 응답에 있었지만 요청에서 빠진 하위 행은 삭제된다.
- 상품 모델은 기본 필드 `seq`, `wholesaleStoreSeq`, `categorySeq`, `name`, `description`, `status`, `minOrderQuantity`, `createdAt`, `updatedAt`과 aggregate 필드 `images`, `options`, `variants`, `viewCount`를 포함한다.
- 등록·수정 요청의 `images`, `options`, `variants`는 필수 키이며 항목이 없어도 빈 배열을 전송한다. 등록 시 하위 `seq`는 전송하지 않고 수정 시 기존 행에만 전송한다.
- 상품 이미지에는 업로드 완료 URL을 전송하며 현재 `imageType`은 `DETAIL`, 대표 이미지는 `sortOrder: 0`인 첫 이미지다.
- SKU는 `sku`, 색상, 사이즈, 공급가, 판매가, 상태를 포함하며 기본 상태는 `ACTIVE`다. 판매 이력이 있는 SKU는 삭제보다 상태 변경을 우선한다.
- 상품 날짜·시간은 UTC offset이 포함된 ISO-8601 문자열이다.
- 상품 검증 오류는 `{ timestamp, code, message, errors: [{ field, message }] }`이며 화면에서 `errors[].field`를 해당 입력 필드에 연결한다.
- 상품 API 가이드의 상태 허용값은 아직 미확정이다. 화면에서는 사용자 요구에 따라 `DRAFT`(초안), `ACTIVE`(판매중), `SOLD_OUT`(품절), `TEMPORARILY_SOLD_OUT`(일시품절), `SUSPENDED`(판매중지)를 사용하며 추가 세 상태 코드는 백엔드 enum 확정 시 재확인한다.
- 현재 상품 API에는 별도 재고·배송 기준 필드는 없지만 이미지 URL, 옵션, SKU별 공급가·판매가·색상·사이즈 필드는 포함된다.

### 카테고리 API 계약

- `GET /api/v1/categories?activeOnly=true`: Bearer 인증으로 활성 카테고리 트리를 조회한다.
- 응답은 `children`을 갖는 재귀 트리이며 상품 화면에서는 `상위 > 하위` 경로의 단일 select 옵션으로 평탄화한다.
- 사용자가 선택한 카테고리의 `seq`를 상품 목록 검색과 상품 등록·수정의 `categorySeq` 값으로 전송한다.

### 장바구니 API 계약

- 서비스: `src/services/cartApi.ts`
- 상태 관리: `src/stores/cart.ts`
- 타입: `src/types/cart.ts`
- `GET /api/v1/carts`: 로그인 사용자의 주문자·도매처 그룹을 포함한 장바구니 조회
- `POST /api/v1/carts`: `{ productSeq, variantSeq, quantity }` 상품 추가. 성공 `201`, 갱신된 전체 `Cart` 반환
- `PUT /api/v1/carts/{cartSeq}`: `{ quantity }` 수량 수정. 여기서 `cartSeq`는 장바구니 헤더가 아닌 `CartItem.seq`이며 갱신된 전체 `Cart`를 반환
- `DELETE /api/v1/carts/{cartSeq}`: `CartItem.seq`에 해당하는 단일 상품 삭제. 성공 `204`이며 body가 없다.
- 응답은 사용자 API envelope가 아닌 `Cart` DTO를 직접 반환한다. `buyer`에는 소매 매장·사업자·대표 사용자 정보가, `wholesales`에는 도매 매장별 사업자 정보·품목·소계가 포함된다.
- 수량은 프론트에서 1 이상인지 먼저 검증하며 동일 variant 추가 시 서버가 기존 수량에 합산한다.
- 체크 선택은 서버 계약에 없는 화면 로컬 상태이며 선택 변경 API를 호출하지 않는다.
- 장바구니 최초 조회, 이미 초기화된 장바구니 화면 재진입, 상품 추가 응답 반영 시 전체 상품을 기본 선택한다. 화면 안에서 사용자가 해제한 선택은 수량 변경·삭제 후 서버 응답을 반영할 때 유지한다.
- 금액은 서버의 `salePrice`, `lineAmount`, `totalAmount`를 사용하고 프론트에서 단가를 다시 곱해 확정 금액을 만들지 않는다.
- `CART002`, `CART003` 오류 시 목록을 다시 조회한다. 예상하지 못한 `401`은 토큰을 한 번 재발급한 뒤 재시도한다.
- 서버가 Bearer 토큰의 사용자 PK를 사용하므로 프론트는 `userSeq`나 `retailStoreSeq`를 경로·body·환경 변수로 전달하지 않는다. 별도 장바구니 생성 API 없이 최초 상품 추가 시 행이 생성된다.

### 서비스 관리자 사업자·매장 API 계약

- 모든 요청은 Bearer 인증이 필요하며 API 기본 URL의 `/api/v1`은 환경 변수에서 제공한다.
- 사업자 프로필: `GET/POST /admin/business-profiles`, `PUT /admin/business-profiles/{businessProfileSeq}`
- 도매 매장: `GET/POST /admin/wholesale-stores`, `PUT /admin/wholesale-stores/{wholesaleStoreSeq}`
- 소매 매장: `GET/POST /admin/retail-stores`, `PUT /admin/retail-stores/{retailStoreSeq}`
- 매장 목록은 선택 쿼리 `businessProfileSeq`를 지원하고, 생략 시 전체 목록을 조회한다.
- 등록 성공은 `201`, 목록·수정 성공은 `200`이며 응답 DTO를 직접 사용한다.
- nullable 필드인 승인일, 시장명, 층/호수, 판매 채널은 빈 문자열 대신 `null`을 전송한다.
- 상태 허용값은 미확정이므로 프론트에서 select enum으로 고정하지 않고 문자열 입력으로 처리한다.
- 사업자 프로필 승인 상태는 화면에서 `PENDING`, `APPROVED`, `REJECTED` select로 제공하고 `APPROVED` 선택 시 서비스 로컬 시각의 승인일을 자동 설정하며 다른 상태에서는 `null`을 전송한다.
- 사용자 관리: `GET/POST /admin/users`, `PUT /admin/users/{userSeq}`. 목록은 `seq` 내림차순 DTO 배열이며 비밀번호를 포함하지 않는다.
- 사용자 등록은 모든 필드가 필수이고, 수정 시 `passwd`를 생략하면 기존 비밀번호를 유지한다. 오류 `AU001`, `AU002`와 공통 `C001`을 화면 오류로 표시한다.
- 서비스 관리자 등록·수정 화면의 모든 상태 입력은 select로 제공한다. 사용자 상태는 `PENDING`, `ACTIVE`, `SUSPENDED`, 매장 상태는 `ACTIVE`, `INACTIVE`, `SUSPENDED`를 사용하며 API에서 그 밖의 기존 값이 반환되면 수정 화면 select에 보존한다.
- 대표 사용자 팝업은 `GET /admin/users`의 실제 사용자 목록을 SEQ·아이디·이름·연락처·상태로 검색해 선택한다.
- 도매·소매 매장 등록·수정의 사업자 프로필은 ID를 직접 입력하지 않고 `GET /admin/business-profiles` 목록 팝업에서 사업자번호·상호·대표자·사용자·승인 상태로 검색해 선택한다.
- 오류 코드는 `BP001`~`BP003`, `WS001`~`WS002`, `RS001`~`RS002`, 공통 `C001`/`C002`를 처리한다.

### 주문 API 계약

- `POST /orders/from-cart`: 선택한 `CartItem.seq` 배열, 주문 소매 매장, 수령인 정보를 전송하고 생성된 `Order`를 직접 반환한다.
- `GET /orders`, `GET /orders/{orderSeq}`: 로그인 사용자의 사업자 프로필에 연결된 소매 매장 주문 목록·상세를 조회한다.
- `GET /admin/orders`: 서비스 관리자가 전체 주문을 최신 순서로 조회한다.
- 도매 주문·출고는 `/wholesale/orders`, `/wholesale/shipments` 전용 API를 사용하며 서버가 로그인 사용자의 도매 매장 소유권을 검증한다.
- 모든 주문 품목이 `PRODUCT_READY`가 되면 출고가 자동 생성되며, 수동 생성 API는 기존 출고를 멱등 반환한다.
- 주문 요청에는 상품 금액을 보내지 않으며 서버가 판매가·배송비·할인·총액을 확정한다. 성공 주문에 포함된 장바구니 행은 서버에서 삭제된다.
- 주문 오류는 `O001`~`O004`, `RS001`, `P002` 및 공통 `C001`의 서버 한글 상세 `message`를 오류 영역에 표시한다.
- 주문 오류 화면 분기는 안정적인 `code`만 사용하고, 상세 `message` 문자열은 파싱하지 않는다.

### 도매상품 재고 API 계약

- `GET /wholesale/inventory`: 로그인 사용자가 소유한 도매 매장의 상품·SKU 옵션·재고 정보를 `seq` 내림차순으로 조회한다.
- `POST /wholesale/inventory`, `PUT /wholesale/inventory/{inventorySeq}`: `variantSeq`, 주문 가능 수량, 예약 수량을 등록·전체 수정한다.
- `POST /wholesale/inventory/bulk`: `seq`가 있는 행은 수정하고 없는 행은 등록하며, 전체 성공 또는 전체 롤백되는 다건 저장 API다.
- 도매상품 재고 API는 2026-08-20 가이드 변경에 따라 기존 `/admin/inventory`에서 `/wholesale/inventory`로 이동했다. 프론트 관리자 화면 경로 `/admin/supplier/inventory`는 유지한다.
- 벌크 화면은 요청 내부의 중복 `seq`·`variantSeq`와 음수·비정수 수량을 API 호출 전에 검증한다.
- 재고 일괄 관리의 `SKU 여러 개 선택` 팝업은 상품명·SKU·색상·사이즈·상태·Variant ID 검색과 체크박스 다중 선택을 지원하며, 선택한 SKU마다 신규 재고 행을 한 번에 생성한다.
- 단건 재고 수정과 재고 일괄 관리에서 기존 `variantSeq`는 읽기 전용으로 표시하며 상품 SKU를 변경할 수 없다. 신규 재고는 SKU 선택 팝업으로만 추가한다.
- 주문 가능 수량과 예약 수량은 0 이상의 정수로 검증하며 `totalQuantity`는 서버 응답 전용 합계다.
- SKU는 상품 목록 API의 variant를 검색하는 팝업에서 선택한다. 재고 한 행당 variant 하나만 허용되며 `INV001`, `INV002`, `P003`, `C001` 오류를 표시한다.

### 서비스 관리자 택배사 API 계약

- `GET /admin/delivery-companies`: 택배사 목록을 코드 오름차순으로 조회한다.
- `POST /admin/delivery-companies`: 코드, 이름, 배송조회 URL 템플릿, 활성 여부로 택배사를 등록한다.
- `PUT /admin/delivery-companies/{code}`: 경로의 기존 코드를 유지하며 이름, 배송조회 URL 템플릿, 활성 여부를 수정한다.
- 코드는 최대 30자, 이름은 최대 100자이며 배송조회 URL의 공백 문자열은 `null`로 전송한다.
- 오류 `DC001`, `DC002`, 공통 `C001`의 서버 메시지와 필드 오류를 화면에 표시한다.
- 도매 출고 화면은 `GET /wholesale/delivery-companies`에서 활성 택배사의 `code`, `name`만 조회해 select로 제공하며 코드를 직접 입력받지 않는다.

### 도매상품 입고 API 계약

- `GET /wholesale/stock-receipts`: 상품·SKU 옵션·도매 매장 표시 정보가 결합된 입고 목록을 `seq` 내림차순으로 조회한다.
- `POST /wholesale/stock-receipts`: `variantSeq`, 1 이상의 입고 수량, nullable 메모로 입고를 등록하며 상태는 보내지 않는다. 서버가 `REGISTERED`로 생성한다.
- `PUT /wholesale/stock-receipts/{receiptSeq}`: SKU, 수량, 메모와 상태를 전체 수정한다. 상태는 `REGISTERED` → `EXPECTED` → `COMPLETED` 순서만 허용한다.
- `COMPLETED` 전환 시 서버 트랜잭션으로 주문 가능 재고가 증가하며, 완료된 입고는 프론트에서도 수정할 수 없도록 보기 전용으로 표시한다.
- 오류 `SR001`, `SR002`, `P003`, 공통 `C001`의 서버 메시지와 필드 오류를 화면에 표시한다.

### 현재 연동 상태

- 회원가입, 로그인, 현재 사용자 조회, 토큰 재발급, 로그아웃은 `src/services/authApi.ts`와 `src/stores/auth.ts`를 통해 실제 API에 연결되어 있다.
- 로그인 실패 코드 `2000`, `2047`, `2048`과 회원가입 오류 코드 `DUPLICATE_USER`, `INVALID_VALUE_REQUEST`, `REQUIRED_DATA_NOT_FOUND`를 화면 상태에 반영한다.
- 동시 토큰 재발급 요청은 Pinia 스토어의 단일 Promise를 공유하며, 사용자 조회가 `401`이면 한 번 재발급 후 재시도한다.
- 장바구니 목록·추가·수량 수정·삭제는 `src/services/cartApi.ts`와 `src/stores/cart.ts`를 통해 실제 API에 연결되어 있다.
- 선택 장바구니 주문 생성, 내 주문 목록·상세, 관리자 주문 목록은 `src/services/orderApi.ts`와 `src/stores/orders.ts`를 통해 실제 API에 연결되어 있다.
- 도매 관리자 상품 재고 목록·등록·수정은 `src/services/adminInventoryApi.ts`와 `src/stores/adminInventory.ts`를 통해 실제 API에 연결되어 있다.
- 서비스 관리자 택배사 목록·등록·수정은 `src/services/adminDeliveryCompanyApi.ts`와 `src/stores/adminDeliveryCompanies.ts`를 통해 실제 API에 연결되어 있다.
- 도매상품 입고 목록·등록·수정은 `src/services/adminStockReceiptApi.ts`와 `src/stores/adminStockReceipts.ts`를 통해 실제 `/wholesale/stock-receipts` API에 연결되어 있다. 2026-08-20 가이드 변경에 따라 기존 `/admin/stock-receipts` 경로에서 이동했다.
- 관리자 상품 목록·상세·등록·수정은 실제 API로 전환했다. 상품 API의 응답 DTO 직접 반환 방식과 전용 오류 구조를 반영했다.
- 서비스 관리자 사업자 프로필·도매 매장·소매 매장 목록/등록/수정은 `src/services/adminBusinessApi.ts`와 `src/stores/adminBusinesses.ts`를 통해 실제 API에 연결했다. 수정용 상세 API가 없어 목록 응답에서 대상 `seq`를 찾아 폼을 채운다.
- 상품 요청은 Bearer 인증을 사용하며 `401`이면 access token 재발급 후 한 번 재시도한다. 인증 복구 실패 시 로그인으로 이동하고 로그인 성공 후 기존 관리자 주소로 복귀한다.
- 장바구니 상품 추가는 실제 상품 상세의 `productSeq`와 선택 SKU의 `variantSeq`를 전송한다.
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

### 2026-08-19

- 관리자 사용자 등록·수정 및 목록에 `WHOLESALE`(도매), `RETAIL`(소매), `ADMIN` 사용자 구분을 추가
- 로그인 후 `/users/info`의 사용자 구분에 따라 도매는 도매 관리자, 소매는 서비스 메인, ADMIN은 서비스 관리자 화면으로 이동
- 도매·소매 사용자는 자신의 관리자 영역에만 접근하고 ADMIN은 도매·소매·서비스 관리자 영역을 모두 전환할 수 있도록 메뉴와 라우터 가드 적용
- 사용자 구분 API 필드와 서버 권한 계약이 기존 확정 가이드에 없어 `docs/api-guide.md`의 `API-007`로 보완 요청 기록

### 2026-08-18

- 도매 관리자 사이드바의 `입고 관리` 메뉴를 `주문 관리` 바로 위로 이동
- `docs/frontend-api-guide.md` 13.5를 재확인해 입고 중간 상태를 `CHECKING`에서 계약값 `EXPECTED`(입고예정)로 수정
- 입고 관리 목록에서 현재 상태와 다음 상태만 선택해 바로 저장할 수 있도록 상태 변경 UI를 추가하고, 완료 전환에는 재고 반영 확인 절차 적용
- 사용자·사업자·상품·재고·주문·입고·출고 화면의 모든 일시를 공통 `YYYY-MM-DD HH:mm:ss` 형식으로 통일하고 밀리초는 노출하지 않음

### 2026-08-14

- `docs/frontend-api-guide.md` 13.5의 도매상품 입고 API 계약을 우선 참조해 입고 목록·등록·수정 화면과 도매 관리자 메뉴 구현
- 상품 API 기반 SKU 선택, 1 이상 정수 수량 검증, nullable 메모, `REGISTERED` → `EXPECTED` → `COMPLETED` 상태 전이 제한 반영
- 완료 입고를 보기 전용으로 잠그고 완료 시 주문 가능 재고가 서버 트랜잭션으로 반영된다는 안내 추가
- 입고 API 서비스 테스트 3개 추가, `npm run build`, `npm test -- --run`(총 42개), 관련 ESLint 통과

### 2026-08-13

- 관리자 페이지의 콘텐츠가 화면보다 길어져도 왼쪽 메뉴의 검은 배경이 문서 하단까지 이어지도록 관리자 셸 배경과 사이드바 높이 처리 수정
- `docs/frontend-api-guide.md` 9.4의 최신 계약에 따라 도매 출고관리 택배사 코드 자유 입력을 `GET /wholesale/delivery-companies` 기반 활성 택배사 select로 변경
- 기존 출고 코드가 활성 목록에 없을 때 값을 잃지 않도록 기존 코드 option을 보존하고 택배사 선택 API 회귀 테스트 추가
- `docs/frontend-api-guide.md`의 2026-08-13 택배사 관리 API 계약을 우선 참조해 서비스 관리자 목록·등록·수정 화면 구현
- 관리자 메뉴와 `/admin/delivery-companies` 하위 라우트 연결, Bearer 인증과 `401` 토큰 재발급·재시도 적용
- 택배사 코드 수정 방지, 코드·이름 길이 검증, 빈 배송조회 URL의 `null` 변환, 활성·비활성 필터 및 서버 필드 오류 표시 반영
- 택배사 API 서비스 테스트 3개를 추가하고 `npm run build`, `npm test -- --run`(총 38개) 통과

### 2026-08-10

- API 연동의 우선 참조 문서인 `docs/frontend-api-guide.md`의 서비스 관리자 API 계약 확인
- 사업자 프로필·도매 매장·소매 매장 목록/등록/수정 화면과 서비스 관리자 메뉴 구현
- Bearer 인증, 401 토큰 재발급·재시도, 목록의 사업자 프로필 필터, nullable 필드의 `null` 변환, 서버 필드 오류 표시 반영
- API 경로는 환경 변수에 `/api/v1`이 포함되는 기존 프로젝트 규칙에 따라 `/admin/...` 리소스 경로로 연결
- 새로 추가된 서비스 관리자 사용자 목록·등록·수정 API를 연결하고 사용자 관리 화면 및 대표 사용자 API 검색 팝업 구현
- 사용자·사업자 프로필·도매 매장·소매 매장 검색 영역의 초기화와 실행 버튼 크기를 동일하게 통일

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

### 2026-07-31

- `docs/frontend-api-guide.md`의 2026-07-31 장바구니 계약을 우선 참조해 기존 메모리 목업을 실제 API로 전환
- 장바구니 목록·상품 추가·수량 수정·단일 삭제를 `/carts/{cartSeq}/items` 계열 API와 Bearer 인증에 연결
- 상품 상세에서 `productSeq`, `variantSeq`, `quantity`를 전송하도록 장바구니 추가 요청 수정
- 장바구니 타입과 UI를 서버 `Cart`/`CartItem` DTO에 맞추고 계약에 없는 도매처·재고·배송비 표시 제거
- 선택 상태는 로컬 UI 상태로 분리하고 금액은 서버 `lineAmount`, `totalAmount`를 표시하도록 변경
- 요청 중 중복 동작 방지, 수량 1 이상 검증, `401` 재발급·재시도, `CART002`/`CART003` 목록 재조회 처리
- 기본 장바구니 생성·조회 API 미확정에 따라 `cartSeq`를 추측하지 않고 서버 전달값 또는 임시 `VITE_CART_SEQ`만 사용
- 장바구니 API 단위 테스트 3개 추가
- 메인 상단 배너를 이미지 배경·어두운 오버레이·짧은 제목과 설명·단일 CTA 구성으로 단순화
- 메인 배너 높이를 데스크톱 320px, 태블릿 280px, 모바일 240px로 축소하고 실제 반응형 화면 검증
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

### 2026-07-29

- 관리자 상품 목록에 `images[0]` 대표 이미지와 이미지 없음 fallback 추가
- 관리자 상품 상세를 대표·추가 이미지 갤러리, 기본 정보, 설명, 옵션 표, SKU별 공급가·판매가·예상 마진 표로 확장
- 관리자 상품 상세의 이미지 썸네일을 클릭하면 상단 큰 이미지가 변경되며 현재 선택 이미지를 강조 표시
- 활성 카테고리 트리 API를 연결하고 상품 목록 검색 및 등록·수정 카테고리를 단일 select로 변경
- 상품 목록·상세에서는 `categorySeq` 숫자 대신 `상위 > 하위` 카테고리 이름을 표시하고 요청에는 선택한 `seq` 유지
- 상품 상태 입력과 목록 검색을 API 가이드에서 확인된 `DRAFT`, `ACTIVE` select로 변경
- 상품 등록·수정 폼의 모든 필수 표시를 해당 필드 명칭 바로 옆에 배치
- 상품 상태 select에 `SOLD_OUT`(품절), `TEMPORARILY_SOLD_OUT`(일시품절), `SUSPENDED`(판매중지)를 추가하고 목록·상세에 한글 명칭 표시
- 상품 상태 코드 `DRAFT`는 유지하고 화면 표시 명칭만 `초안`에서 `등록`으로 변경
- SKU 상태 입력을 select로 변경하고 `ACTIVE`(판매중), `TEMPORARILY_SOLD_OUT`(일시품절), `SOLD_OUT`(품절), `SUSPENDED`(판매중지) 제공
- 관리자 상품 목록·상세는 사이드바를 제외한 가용 화면 전체를 사용하고, 표와 상세 열은 최소 너비를 보장하면서 화면 비율에 따라 유동적으로 확장
- 상품 목록 표는 최소 너비 아래에서 가로 스크롤하고 상세 상단은 760px 이하에서 단일 열로 전환
- 관리자 상품 상세 상단의 상품 수정 버튼 옆에 역할별 상품 관리 목록 이동 버튼 추가
- 로그인 access token과 만료 시각을 `sessionStorage`에 저장해 새로고침 로그인 유지 및 로그아웃·브라우저 세션 종료 시 제거
- API 요청 전에 access token 만료를 확인해 10초 이내면 선제 재발급하고, `401` 응답 시에도 단일 재발급 후 한 번 재시도
- 관리자 전체 라우트에 로그인 필수 가드를 적용하고 로그인 후 원래 관리자 주소로 복귀

### 2026-07-30

- 서비스 헤더 아래에 활성 카테고리 API 기반 가로 카테고리 바를 배치하고 최상위 카테고리를 항상 노출
- 최상위 카테고리 호버·포커스·터치 시 하위·손자 카테고리를 메가메뉴로 펼치고 선택한 이름 경로와 `categorySeq` 쿼리로 이동
- 모바일 카테고리 바는 가로 스크롤, 하위 메가메뉴는 터치 가능한 가로 그룹 구조로 제공
- 카테고리 API가 인증 필수이므로 비로그인 상태에서는 상단 바에 로그인 후 카테고리 보기 링크를 표시
- 29CM의 에디토리얼 커머스 패턴을 참고하되 복제하지 않고 YH MARKET B2B 맥락으로 메인 화면 전면 개편
- 대형 도매 소싱 히어로, B2B 신뢰 지표, 셀러 관점 에디토리얼 3종, 미니멀 신상품 10종, 전체 상품 탐색, 도매 파트너 선언 영역 구성
- 검정·흰색 중심의 절제된 색상, 사진 중심의 평면 카드, 작은 가격 정보와 넓은 여백을 적용하고 태블릿·모바일 반응형 구성
- 메인과 카테고리 상품 목록을 실제 `GET /products` API로 전환하고 서버 페이지·`categorySeq`·상품명 검색 연결
- API 상품 카드에 대표 이미지, 도매상, 상품 상태, 첫 SKU 공급가·권장 판매가, 최소 주문, 예상 마진, 조회수 표시
- 카테고리 상품 목록은 화면 전체 너비, 대형 카테고리 헤더, API 카테고리 탭, 검색·클라이언트 가격/마진 정렬, 서버 페이지 이동으로 구성
- 상품 API가 Bearer 인증 필수이므로 비로그인 상태에는 사업자 로그인 안내를 표시하고 토큰 만료 시 재발급 후 요청 재시도
- 카테고리 상품 목록의 보조 메뉴는 전체 트리가 아니라 현재 선택 카테고리가 속한 최상위 카테고리의 직속 2뎁스만 노출
- 서비스 상단 카테고리는 29CM형 단일 가로 내비게이션으로 최상위 1뎁스만 노출하고 레이어·2뎁스는 표시하지 않음
- 2뎁스는 카테고리 상품 목록 내부에서만 노출하며 모바일 상단 1뎁스는 한 줄 가로 스크롤로 제공
- 상품 등록·수정 폼의 이미지·옵션·SKU 입력을 데스크톱 한 행 편집 구조로 개선하고 모바일에서는 세로 입력 구조로 전환
- `npm run build`, `npm run test`(총 13개), `npm run lint` 통과

### 2026-07-31

- `docs/frontend-api-guide.md`의 상품 상세 계약을 우선 참조해 셀러 `/products/:id`를 로컬 샘플에서 실제 `GET /products/{productSeq}` API로 전환
- 상품 상세에서 API 이미지 정렬 및 썸네일 클릭 전환, 카테고리명, 상품 설명·상태·조회수, 옵션과 SKU별 공급가·판매가·상태를 표시
- 판매중인 상품과 SKU만 선택한 SKU 코드로 장바구니에 담고 최소 주문 수량 아래로 수량이 내려가지 않도록 처리
- 상품 API에 없는 재고·배송비·출고 예정 정보는 상세 화면에서 제거하고 이미지·SKU가 없는 상태 및 로그인·로딩·오류 상태 추가
- 상품 상세 스토어 회귀 테스트 추가, 관련 테스트 6개 및 `npm run build-prod` 통과
- 셀러 상품 상세 조회 성공 후 조회 로그 API를 호출하고 상세를 재조회해 서버의 최신 `viewCount`를 표시
- 셀러 상품 상세 SKU는 복수 선택과 동일 SKU 중복 선택을 지원하며, SKU 버튼을 클릭할 때마다 해당 SKU 수량을 1개씩 누적하고 SKU별 수량·금액과 전체 수량·금액을 표시

### 2026-08-03

- `docs/frontend-api-guide.md`의 2026-08-03 장바구니 계약을 우선 참조해 장바구니 타입·서비스·스토어·화면 재구성
- `GET /retail-stores/{retailStoreSeq}/cart`로 소매 매장 장바구니를 조회하고 없으면 서버에서 자동 생성하도록 연결
- 기존 `cartSeq` 환경 설정과 직접 연결 방식을 제거하고 서버가 반환한 `cartSeq`만 품목 API에 사용
- 상품 추가·수량 수정 응답의 갱신된 전체 `Cart`를 즉시 상태에 반영하고 삭제 후 목록 재조회
- 장바구니 화면에 소매 주문자의 매장·사업자·대표자·담당자 정보 표시
- 품목을 도매 매장별로 그룹화하고 도매 사업자·시장 위치·그룹 수량·소계를 표시
- `RS001`, `CART004`는 소매 매장 또는 사업자 정보 등록 안내로 구분하고 `CART001`은 매장 장바구니 재조회·생성으로 복구
- 로그인 사용자의 기본 소매 매장 선택 API 미확정에 따라 임시 `VITE_RETAIL_STORE_SEQ` 또는 서버 전달값만 사용
- 소매 매장 장바구니 자동 생성 API 테스트를 추가해 전체 테스트 24개 통과

### 2026-08-10

- `docs/frontend-api-guide.md`의 2026-08-10 단일 `carts` 테이블 계약을 우선 참조해 장바구니 API 재연동
- 목록·추가 경로를 로그인 사용자 기준 `GET/POST /carts`로 변경하고 `userSeq`, `retailStoreSeq` 전송 제거
- 별도 장바구니 조회·자동 생성 API와 `VITE_RETAIL_STORE_SEQ` 환경 설정 제거
- `CartItem.seq`를 수정·삭제 경로의 `cartSeq`로 사용하도록 `PUT/DELETE /carts/{cartSeq}` 적용
- `Cart` 최상위 식별자를 `cartSeq`에서 `userSeq`로 변경하고 불필요한 생성·수정 시각 제거
- 추가·수정 응답의 전체 `Cart` 반영, 삭제 후 목록 재조회, `CART002`·`CART003` 복구 유지
- 앱 초기화와 화면 진입 시 장바구니 목록 Promise를 공유해 중복 조회 방지
- 최신 장바구니 경로와 payload를 검증하는 서비스 테스트 4개 구성

## 9. 유지 규칙

- 모든 작업 전 `AGENTS.md`, 이 문서, API 작업 시 `docs/frontend-api-guide.md`를 확인한다.
- 기능, 구조, API, 환경 변수 이름, 주요 결정 또는 검증 결과가 바뀌면 이 문서를 갱신한다.
- 비밀번호, 토큰, API 키, 환경 변수 실제 값 등 비밀 정보는 기록하지 않는다.
- 완료되지 않은 기능을 완료된 것으로 기록하지 않는다.

### 2026-08-27

- 서비스 관리자 사이드바에 `전체 문의` 메뉴와 `/admin/inquiries` 전용 라우트 추가
- 도매·셀러 전체 문의의 키워드·유형·사용자 구분·처리 상태 검색, 10페이지 단위 페이지 이동, 답변 등록·수정, 상태 변경 UI 구현
- 로그인 사용자의 문의만 반환하는 공통 `/support/inquiries`는 관리자 화면에서 재사용하지 않고 별도 `/admin/support/inquiries` API 클라이언트·스토어 구성
- 필요한 관리자 전체 문의 목록·답변·상태 변경 API 계약과 권한·필드·검증 규칙을 `docs/api-guide.md` API-012로 요청
- 관리자 문의 API 계약은 아직 `docs/frontend-api-guide.md`에 확정되지 않았으므로 백엔드 미구현 오류를 화면에 명시적으로 표시

### 2026-09-04

- Vercel 의존성 설치를 잠금 파일 기반 `npm ci`로 변경하고, 복원된 캐시를 우선 사용하며 배포 중 불필요한 audit·funding 요청을 생략하도록 설정했다. (`COMMERCE_VercelNodeVersion_002`)
