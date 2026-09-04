# Commerce API 보완 요청 가이드

> 최종 갱신일: 2026-08-27
> 목적: 프론트엔드 API 연동 중 추가로 필요한 필드와 업무 로직을 백엔드와 협의하기 위한 기록

## 작성 원칙

- 확정된 API 연동 계약은 `docs/frontend-api-guide.md`를 우선 참조한다.
- 구현 중 응답 필드가 부족하거나 상태 전이, 권한, 검증 기준이 불명확하면 이 문서에 기록한다.
- 프론트에서 임의로 계약을 확정하지 않고 현재 임시 처리와 필요한 백엔드 계약을 함께 남긴다.
- 백엔드 계약이 확정되면 `docs/frontend-api-guide.md`에 반영하고 이 문서 항목은 `해결`로 변경한다.
- 비밀번호, 토큰, API 키와 실제 개인정보는 기록하지 않는다.

## 기록 형식

각 항목은 다음 정보를 포함한다.

- 상태: `요청`, `협의 중`, `해결`
- 요청일과 대상 기능
- 현재 API 또는 응답
- 필요한 필드 또는 업무 로직
- 필요한 이유와 프론트 임시 처리
- 확정 결과 및 반영 문서

## 요청 항목

### API-001 도매 주문 상품 옵션 구조 확정

- 상태: 해결
- 요청일: 2026-08-12
- 대상: 도매 주문 관리
- 현재 API: `GET /api/v1/wholesale/orders`
- 기존 응답: `items[].options`가 `Record<string, unknown> | null`이었다.
- 확정 계약: `items[]`에 nullable 고정 필드 `sku`, `color`, `size`를 반환한다.
- 이유: 키가 확정되지 않은 객체는 옵션 순서와 사용자 표시 명칭을 안정적으로 구성할 수 없다.
- 반영: 화면은 `sku`, `color`, `size`를 순서대로 표시하고 모두 없으면 `variantSeq`를 표시한다.
- 반영 문서: `docs/frontend-api-guide.md` 9.4 (2026-08-24 확인)

### API-002 도매 주문 초기 상태 호환 계약

- 상태: 해결
- 요청일: 2026-08-12
- 대상: 도매 주문 상품 상태 변경
- 현재 계약: 초기 상태는 `PRODUCT_ORDERED`다.
- 확정 계약: 서버가 레거시 `CREATED`를 주문과 주문 품목 응답에서 `PRODUCT_ORDERED`로 정규화한다.
- 반영: 프론트 타입과 화면에서 `CREATED` 호환 분기를 제거했다.
- 반영 문서: `docs/frontend-api-guide.md` 9.4 (2026-08-24 확인)

### API-003 로그인 사용자의 도매 매장 선택 목록

- 상태: 해결
- 요청일: 2026-08-12
- 대상: 도매 주문·출고 검색
- 확정 API: `GET /api/v1/wholesale/stores`는 로그인 사용자가 소유한 도매 매장의 `seq`, `storeName`, `status` 목록만 반환한다.
- 이유: 사용자가 매장 SEQ를 직접 기억해서 입력하지 않고 매장명 select로 안전하게 검색해야 한다.
- 반영: 도매 주문·출고 검색의 매장 ID 직접 입력을 제거하고 소유 매장명 select로 변경했다. 선택한 `seq`만 목록 API의 `wholesaleStoreSeq` query로 전송한다.
- 반영 문서: `docs/frontend-api-guide.md` 9.4 도매 주문 처리 및 출고 (2026-08-21)

### API-004 활성 택배사 코드 목록

- 상태: 해결
- 요청일: 2026-08-12
- 대상: 출고 관리
- 현재 계약: 출고 완료 시 `deliveryCompanyCode`가 필수이고 존재하지 않거나 비활성 코드면 `SH004`가 반환된다.
- 확정 계약: 서비스 관리용 `GET /api/v1/admin/delivery-companies`와 별도로, 도매 출고 화면은 `GET /api/v1/wholesale/delivery-companies`에서 활성 택배사의 `code`, `name` 목록을 택배사명·코드 오름차순으로 조회한다.
- 이유: 자유 입력은 유효하지 않은 코드 입력 가능성이 높으므로 택배사명 select가 필요하다.
- 반영: 서비스 관리자 택배사 목록·등록·수정 화면과 도매 출고 화면의 활성 택배사 선택을 구현했다. 기존 출고에 현재 활성 목록에 없는 코드가 있으면 해당 코드를 보존해 표시한다.
- 반영 문서: `docs/frontend-api-guide.md` 9.4 도매 주문 처리 및 출고, 13.4 택배사 관리 API (2026-08-13)

### API-005 도매 주문 목록의 소매 매장 표시 정보

- 상태: 해결
- 요청일: 2026-08-12
- 대상: 도매 주문 관리
- 기존 응답: `retailStoreSeq`만 제공했다.
- 확정 계약: nullable `retailStoreName`, `buyerCompanyName`을 함께 반환한다.
- 이유: 숫자 SEQ만으로는 도매 담당자가 주문 구매처를 식별하기 어렵다.
- 반영: 화면에 소매 매장명과 구매처 사업자명을 표시하고 값이 없을 때만 대체 문구를 사용한다.
- 반영 문서: `docs/frontend-api-guide.md` 9.4 (2026-08-24 확인)

### API-006 도매 주문 품목 상태 변경 응답 구조

- 상태: 해결
- 요청일: 2026-08-12
- 대상: 도매 주문 품목 상태 변경
- 현재 API: `PATCH /api/v1/wholesale/orders/{orderSeq}/items/{orderItemSeq}/status`
- 확정 계약: 성공 `200` 응답은 로그인 사용자의 소유 매장 품목을 모두 포함한 전체 `WholesaleOrder`다.
- 이유: 품목 단위 응답을 주문 전체로 간주해 교체하면 응답에 없는 기존 품목 라인이 사라질 수 있다.
- 반영: PATCH 성공 후 응답의 전체 주문으로 대상 주문을 교체하며 소유 매장 방어 필터를 유지한다.
- 반영 문서: `docs/frontend-api-guide.md` 9.4 (2026-08-24 확인)

### API-007 사용자 도매·소매·ADMIN 구분 및 권한 계약

- 상태: 해결
- 요청일: 2026-08-19
- 대상: 서비스 관리자 사용자 등록·수정, 현재 사용자 조회, 로그인 후 이동, 관리자 화면 접근 권한
- 현재 API: `docs/frontend-api-guide.md`의 `User`, `AdminUser`, `AdminUserCreateRequest`, `AdminUserUpdateRequest`에는 사용자 구분 필드가 없고 로그인 응답은 토큰만 반환한다.
- 필요 필드: `userType: 'WHOLESALE' | 'RETAIL' | 'ADMIN'`을 사용자 테이블에 저장하고 `GET /api/v1/users/info`, `GET /api/v1/admin/users`, `POST/PUT /api/v1/admin/users` 요청·응답에 포함해야 한다.
- 필요 권한: `WHOLESALE`은 도매 관리자 경로, `RETAIL`은 소매 관리자 경로, `ADMIN`은 도매·소매·서비스 관리자 경로에 접근할 수 있어야 하며 백엔드도 같은 기준으로 `403`을 반환해야 한다.
- 이유: 로그인 응답의 토큰만으로는 프론트가 사용자 구분을 판별할 수 없고, 화면 가드만으로는 API 접근 권한을 보장할 수 없다.
- 임시 처리: 프론트는 로그인 직후 `/users/info`의 `userType`으로 이동·메뉴·라우트를 제어한다. 필드가 없는 기존 응답은 권한 확대를 막기 위해 `RETAIL`로 처리한다.
- 2026-08-19 확정: `docs/frontend-api-guide.md`에 따라 로그인 응답의 `landingPage`로 최초 이동하고 `roles`, `adminScopes`로 관리자 메뉴와 경로 접근을 제어한다. `GET /api/v1/users/info`의 `businessType`은 `WHOLESALE | RETAIL`이며 현재 사용자 역할 복원에 사용한다. 회원가입도 필수 `businessType`을 전송한다.

### API-008 도매 주문 응답의 소유 매장 제한 불일치

- 상태: 확인 필요
- 요청일: 2026-08-21
- 대상: `GET /api/v1/wholesale/orders`, 주문 상품 상태 변경
- 확정 계약: `docs/frontend-api-guide.md` 9.4에 따라 로그인 사용자의 사업자 프로필에 연결된 도매 매장 상품만 조회·변경할 수 있어야 한다.
- 현재 현상: 주문 관리 응답에 로그인 사용자가 소유하지 않은 것으로 보이는 여러 도매 매장 품목이 노출된다.
- 필요 조치: 백엔드는 토큰의 사용자 PK → 사업자 프로필 → 도매 매장 소유 관계로 목록의 주문 품목을 제한하고, 다른 매장의 `wholesaleStoreSeq` 필터 및 `orderItemSeq` 상태 변경에는 권한 오류를 반환해야 한다.
- 프론트 제약: `GET /api/v1/wholesale/stores`로 소유 매장 선택 목록은 제한할 수 있지만, 필터를 선택하지 않은 전체 주문 응답의 품목 소유권과 상태 변경 권한은 서버가 보장해야 한다.
- 기존 처리: 프론트는 소유 매장 API 응답만 검색 select에 표시하고 `/wholesale/orders` 응답은 서버 계약을 신뢰했다.
- 2026-08-24 재현: YH 도매에 연결된 로그인 계정의 도매 주문 화면에 `도매 매장 1-2`와 `YH 도매` 품목이 함께 노출됐다. 프론트는 관리자 전체 매장 API를 호출하거나 매장 목록을 합치지 않으므로 `/wholesale/orders` 또는 `/wholesale/stores`의 소유권 조회 결과를 확인해야 한다.
- 프론트 방어 처리: `/wholesale/stores`를 먼저 조회하고, 이 응답의 `seq`에 포함되지 않은 주문 품목과 출고는 화면 상태에서 제거한다. 소유 매장 목록 조회에 실패하면 주문·출고를 조회하거나 표시하지 않는다.
- 백엔드 확인 요청: 해당 계정으로 `GET /api/v1/wholesale/stores`가 YH 도매 한 건만 반환하는지 확인한다. 두 건을 반환한다면 사용자 PK → 사업자 프로필 → 도매 매장 연결 query를 수정해야 한다. 한 건만 반환한다면 `/wholesale/orders`가 반환한 `도매 매장 1-2` 품목은 계약 위반이므로 주문 query의 동일한 소유권 조건을 수정해야 한다.
## API-009 셀러 찜·사업자 화면 응답 DTO

- 상태: 해결 (2026-08-25)
- `GET /api/v1/seller/wishlists`와 `POST /api/v1/seller/wishlists`의 응답 필드가 `docs/frontend-api-guide.md`에 정의되어 있지 않다.
- 찜 화면에는 최소한 찜 식별자, 소매 매장 식별자·명칭, 상품 식별자·상품명·대표 이미지·도매 매장명·가격·상품 상태가 필요하다.
- `GET /api/v1/seller/business`의 응답 DTO도 정의가 필요하다. 사업자 프로필과 연결 소매 매장의 정확한 필드 및 nullable 기준을 확정해야 한다.
- 확정 결과: `SellerWishlist`와 `SellerBusinessResponse`가 가이드 14.1에 추가되어 찜 목록·추가·삭제와 사업자·매장 조회 화면에 반영했다.

## API-010 도매 관리 메뉴 응답 DTO

- 상태: 확인 필요 (2026-08-25)
- `/api/v1/wholesale/management/dashboard`, `claims`, `settlements`, `payout-accounts`, `clients`, `business`의 엔드포인트와 설명은 있으나 정확한 응답 DTO 필드명과 nullable 기준이 문서에 없다.
- 각 목록, 사업자·매장, 정산계좌 조회 응답 타입을 `docs/frontend-api-guide.md`에 추가해야 프론트가 필드를 추측하지 않고 구현할 수 있다.
- 부분 반영: 도매 대시보드는 문서에 확정된 `store_count`, `product_count`, `order_item_count`, `low_stock_count`, `requested_claim_count`를 사용해 구현했다. 나머지 관리 목록 DTO는 계속 확인이 필요하다.

## API-011 식별자 필드 `Seq` 명명 통일

- 상태: 프론트 반영 완료, 백엔드 응답 확인 필요 (2026-08-25)
- 예외: 로그인 아이디 문자열인 `userId`와 이를 포함한 `buyerUserId`는 유지한다. 상품 조회 로그의 명시적 `userId`도 현재 계약 예외로 유지한다.
- 변경: `wholesaleStoreId` → `wholesaleStoreSeq`, 상품 API 경로 변수 `productId` → `productSeq`.
- 유지: `categorySeq`, `productSeq`, `variantSeq`, `retailStoreSeq`, `wholesaleStoreSeq`, `businessProfileSeq`, `orderSeq`, `shipmentSeq`, `shippingAddressSeq` 등 기존 `Seq` 필드.
- JSON snake_case DTO는 동일한 원칙으로 `*_seq`를 사용한다. `user_id`만 예외다.
- 백엔드는 상품 목록·상세·등록·수정 request/response 및 검색 query에서 `wholesaleStoreSeq`를 반환·수신해야 한다.

## API-012 서비스 관리자 전체 문의 관리 API

- 상태: 요청 (2026-08-27)
- 대상: 서비스 관리자 `전체 문의 관리` 목록, 검색, 답변, 상태 변경
- 현재 API: `GET /api/v1/support/inquiries`는 로그인 사용자가 자신이 등록한 문의만 반환하며 `Inquiry[]` 응답이라 서비스 관리자 전체 조회에 사용할 수 없다.
- 권한: 아래 API는 `ROLE_ADMIN`과 `SUPPORT` 관리자 scope에서만 접근할 수 있어야 하며 그 외 사용자는 `403`을 반환해야 한다.
- 목록 요청: `GET /api/v1/admin/support/inquiries?page=0&size=20&keyword=&category=&status=&businessType=`
- 목록 응답: 공통 `PageResponse<AdminInquiry>` 형식으로 `content`, `page`, `size`, `totalElements`, `totalPages`를 반환한다. `keyword`는 문의 제목·내용과 사용자 로그인 ID·이름을 대상으로 검색한다.
- `AdminInquiry` 필수 필드: `seq`, `userSeq`, `userId`, `userName`, `businessType`(`WHOLESALE | RETAIL`), `category`, `title`, `content`, `status`(`OPEN | ANSWERED | CLOSED`), nullable `answer`, nullable `answeredAt`, `createdAt`, `updatedAt`.
- 답변 요청: `PUT /api/v1/admin/support/inquiries/{inquirySeq}/answer`, body `{ "content": string }`, 성공 시 갱신된 `AdminInquiry`를 반환한다. 답변 등록·수정 시 상태는 `ANSWERED`로 변경하고 `answeredAt`을 갱신한다.
- 상태 요청: `PATCH /api/v1/admin/support/inquiries/{inquirySeq}/status`, body `{ "status": "OPEN" | "ANSWERED" | "CLOSED" }`, 성공 시 갱신된 `AdminInquiry`를 반환한다.
- 검증: 답변은 공백만 허용하지 않고 최대 4,000자로 제한한다. 없는 문의는 `404`, 허용되지 않은 상태 전이는 `409`로 구분한다.
- 프론트 반영: `/admin/inquiries` 메뉴·페이지와 API 클라이언트를 위 계약으로 구현했다. 계약 확정 전까지 공통 `/support/inquiries`로 대체하지 않으며 백엔드 미구현 오류를 화면에 표시한다.
- 확정 요청: 경로, 관리자 scope 명칭, 답변 최대 길이와 상태 전이 규칙을 확정한 뒤 `docs/frontend-api-guide.md`에 반영해 달라.
