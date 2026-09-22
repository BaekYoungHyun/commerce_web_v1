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

### 도매 본인 매장 등록 API (COMMERCE_SellerAdminUX_006)

- 상태: 해결 (2026-09-14 프론트·백엔드 구현)
- 기존 도매 관리 API에 등록이 없고 ADMIN 등록 API는 도매 역할에 `403`이므로 `POST /api/v1/wholesale/management/stores`를 추가했다.
- 본인 사업자 `businessProfileSeq`, 사업장명, 시장명, 층·호수, 상태를 전송하고 `201`과 매장 정보를 받는다. 미존재·비소유 사업자는 `404 BP002`로 거부한다.
- 사업자 선택은 기존 본인 사업자·매장 응답을 중복 제거해 사용한다. 수정 팝업은 사업자 연결을 변경하지 않는다.
- ADMIN UI를 참고하되 상태는 서버가 허용하는 `ACTIVE|INACTIVE`로 제한한다. ADMIN의 `SUSPENDED`를 임의 추가하지 않는다.
- 계약·길이·오류 상세는 `docs/frontend-api-guide.md` 2026-09-14 매장 등록·수정 항목을 참조한다. 신규 API 사용에는 실행 서버의 별도 배포가 필요하다.

### 도매 상품 등록·수정 매장 선택 적용 (COMMERCE_SellerAdminUX_005)

- 상태: 해결 (2026-09-14 확인·프론트 적용)
- 상품 등록·수정의 `wholesaleStoreSeq`에는 사업자·매장 관리의 도매 매장 SEQ를 전송한다. `businessProfileSeq`가 아니다.
- `GET /api/v1/wholesale/stores`에서 본인 소유 매장을 조회하고 `storeName`과 매장 `seq`를 선택 박스에 표시한다.
- 수정 시 기존 매장 선택을 유지한다. 조회 실패·빈 목록·선택 목록에 없는 매장은 저장을 차단한다.
- 추가 API 필드는 필요 없으며, 기존 2026-09-07 상품 소유권 계약과 프론트 가이드 9.4의 매장 선택 계약을 사용한다.

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
- 2026-09-07 부분 해결: 백엔드 구현을 대조해 클레임 목록·상태 변경 `WholesaleClaim`과 정산 목록 `WholesaleSettlement` 응답을 확정하고 프론트 화면에 반영했다. `payout-accounts`, `clients`, `business` 응답 DTO는 계속 확인이 필요하다.
- 2026-09-08 프론트 반영: 백엔드 구현 필드와 가이드 설명을 대조해 `payout-accounts`, `clients`, `business` 화면을 구현했다. 정확한 응답 DTO의 가이드 명시는 여전히 필요하다.

## API-011 식별자 필드 `Seq` 명명 통일

- 상태: 프론트 반영 완료, 백엔드 응답 확인 필요 (2026-08-25)
- 예외: 로그인 아이디 문자열인 `userId`와 이를 포함한 `buyerUserId`는 유지한다.
- 변경: `wholesaleStoreId` → `wholesaleStoreSeq`, 상품 API 경로 변수 `productId` → `productSeq`.
- 유지: `categorySeq`, `productSeq`, `variantSeq`, `retailStoreSeq`, `wholesaleStoreSeq`, `businessProfileSeq`, `orderSeq`, `shipmentSeq`, `shippingAddressSeq` 등 기존 `Seq` 필드.
- JSON snake_case DTO는 동일한 원칙으로 `*_seq`를 사용한다. `user_id`만 예외다.
- 백엔드는 상품 목록·상세·등록·수정 request/response 및 검색 query에서 `wholesaleStoreSeq`를 반환·수신해야 한다.
- 2026-09-07 확정: 상품 조회 로그는 요청 body 없이 토큰 사용자를 `userSeq`로 기록하도록 프론트에 반영했다.

## API-013 도매 정산 산출 성공 응답 DTO

- 상태: 해결 (2026-09-07)
- 대상: `POST /api/v1/wholesale/management/settlements/generate`
- 확정 계약: 백엔드 Controller·Service 구현 기준 성공 HTTP Status는 `201 Created`이며, 응답은 산출 후 소유 매장의 전체 정산 목록 `WholesaleSettlement[]`다.
- 응답 필드: `seq`, `wholesale_store_seq`, `store_name`, `period_start`, `period_end`, `gross_amount`, `commission_amount`, `payout_amount`, `status`.
- 프론트 반영: 정산 목록 조회·산출 API, 기간·소유 매장 선택 폼, 산출 직후 반환 목록 갱신, 금액·상태 표시 화면을 구현했다.

## API-014 DB 기반 관리자 내비게이션

- 상태: 백엔드 `menu.route_path` 수정 요청 (2026-09-08)
- 대상 API: `GET /api/v1/menus/navigation?scope=WHOLESALE|RETAIL`
- 문제: API가 반환하는 일부 `routePath`가 실제 Vue Router 경로와 달라 클릭 시 잘못된 화면 또는 Not Found로 이동한다.
- 기준 소스: 프론트 라우터 [src/router/index.ts](../src/router/index.ts). 아래 경로를 DB `menu.route_path`의 확정값으로 사용한다.
- 응답: `MenuItem[]` 2뎁스 트리다. 이동 대상이 없는 1뎁스 그룹은 `routePath: null`, 실제 메뉴인 2뎁스는 `/`로 시작하는 절대 프론트 경로를 반환한다.
- 주의: `routePath`는 백엔드 API 경로가 아니다. `/api/v1`을 붙이지 않으며 API Controller 경로를 저장하지 않는다.

### API-014-1 WHOLESALE 메뉴 경로

| 1뎁스 그룹  | 2뎁스 메뉴       | 권장 code                  | 정확한 `routePath`               |
| ----------- | ---------------- | -------------------------- | -------------------------------- |
| 대시보드    | 대시보드         | `WHOLESALE_DASHBOARD`      | `/admin/supplier/dashboard`      |
| 마스터 관리 | 상품 관리        | `WHOLESALE_PRODUCTS`       | `/admin/supplier/products`       |
| 마스터 관리 | 재고 관리        | `WHOLESALE_INVENTORY`      | `/admin/supplier/inventory`      |
| 마스터 관리 | 재고 일괄 관리   | `WHOLESALE_INVENTORY_BULK` | `/admin/supplier/inventory/bulk` |
| 입출고 관리 | 주문 관리        | `WHOLESALE_ORDERS`         | `/admin/supplier/orders`         |
| 입출고 관리 | 입고 관리        | `WHOLESALE_STOCK_RECEIPTS` | `/admin/supplier/stock-receipts` |
| 입출고 관리 | 출고 관리        | `WHOLESALE_SHIPMENTS`      | `/admin/supplier/shipments`      |
| 입출고 관리 | 반품·취소        | `WHOLESALE_CLAIMS`         | `/admin/supplier/claims`         |
| 정산 관리   | 정산 관리        | `WHOLESALE_SETTLEMENTS`    | `/admin/supplier/settlements`    |
| 기타        | 거래처 관리      | `WHOLESALE_CLIENTS`        | `/admin/supplier/clients`        |
| 기타        | 문의             | `WHOLESALE_INQUIRIES`      | `/admin/supplier/inquiries`      |
| 기타        | 알림             | `WHOLESALE_NOTIFICATIONS`  | `/admin/supplier/notifications`  |
| 기타        | 사업자·매장 관리 | `WHOLESALE_BUSINESS`       | `/admin/supplier/business`       |

도매 상품 등록·상세·수정, 재고 등록·수정, 입고 등록·수정은 목록 화면 내부에서 진입하는 하위 업무 경로이므로 DB 메뉴에 별도 등록하지 않는다.

### API-014-2 RETAIL 메뉴 경로

| 1뎁스 그룹  | 2뎁스 메뉴       | 권장 code              | 정확한 `routePath`            |
| ----------- | ---------------- | ---------------------- | ----------------------------- |
| 대시보드    | 대시보드         | `RETAIL_DASHBOARD`     | `/admin/seller/dashboard`     |
| 마스터 관리 | 상품 탐색        | `RETAIL_PRODUCTS`      | `/admin/seller/products`      |
| 마스터 관리 | 찜 상품          | `RETAIL_WISHLISTS`     | `/admin/seller/wishlists`     |
| 주문 관리   | 장바구니         | `RETAIL_CART`          | `/admin/seller/cart`          |
| 주문 관리   | 주문 관리        | `RETAIL_ORDERS`        | `/admin/seller/orders`        |
| 주문 관리   | 배송지 관리      | `RETAIL_ADDRESSES`     | `/admin/seller/addresses`     |
| 정산 관리   | 결제·환불        | `RETAIL_PAYMENTS`      | `/admin/seller/payments`      |
| 기타        | 문의             | `RETAIL_INQUIRIES`     | `/admin/seller/inquiries`     |
| 기타        | 알림             | `RETAIL_NOTIFICATIONS` | `/admin/seller/notifications` |
| 기타        | 사업자·매장 관리 | `RETAIL_BUSINESS`      | `/admin/seller/business`      |

셀러 상품 상세와 주문 상세는 목록 화면에서 식별자를 붙여 이동하는 동적 경로이므로 DB 메뉴에 등록하지 않는다.

### API-014-3 API 응답 및 검증 요청

```ts
export type MenuScope = 'WHOLESALE' | 'RETAIL'

export interface MenuItem {
  seq: number
  code: string
  name: string
  depth: 1 | 2
  routePath: string | null
  icon: string | null
  sortOrder: number
  children: MenuItem[]
}
```

- `scope=WHOLESALE`에는 `/admin/supplier/**`, `scope=RETAIL`에는 `/admin/seller/**` 경로만 반환한다.
- 1뎁스의 `routePath`는 `null`로 반환하고 자식 메뉴는 `children`에 `sortOrder`, `seq` 순으로 포함한다.
- 2뎁스의 `children`은 빈 배열이며 `routePath`는 위 표의 값과 정확히 일치해야 한다.
- 비활성 메뉴는 응답에서 제외한다.
- 관리자 계정은 명시한 scope를 조회할 수 있고 도매·셀러 일반 계정은 자기 권한 scope만 조회할 수 있어야 한다.
- 수정 후 각 응답의 모든 non-null `routePath`에 대해 Vue Router 매칭 여부를 검증한다.
- 프론트는 DB 메뉴 조회 실패 시 정적 메뉴를 fallback으로 사용하지만, 잘못된 `routePath` 자체를 프론트에서 임의 치환하지 않는다.

서비스 관리자 메뉴는 현재 `/menus/navigation`의 scope 계약 대상이 아니다. 추후 `ADMIN` scope를 추가하려면 아래 실제 목록 경로를 사용한다.

| 메뉴          | 프론트 경로                 |
| ------------- | --------------------------- |
| 전체 주문     | `/admin/orders`             |
| 전체 문의     | `/admin/inquiries`          |
| 사용자 관리   | `/admin/users`              |
| 사업자 프로필 | `/admin/business-profiles`  |
| 도매 매장     | `/admin/wholesale-stores`   |
| 소매 매장     | `/admin/retail-stores`      |
| 택배사 관리   | `/admin/delivery-companies` |

## API-015 서비스 관리자 도매·소매 매장 사용자 정보

- 상태: 요청 (2026-09-09)
- 대상: `GET /api/v1/admin/wholesale-stores`, `GET /api/v1/admin/retail-stores`
- 필요 필드: 각 매장 응답의 `userSeq`, `userId`, `userName`
- 목적: 서비스 관리자 도매 매장·소매 매장 목록에 사업자 ID(`businessProfileSeq`), 사업자명(`companyName`), 사업장명(`storeName`), 대표 사용자 ID와 사용자명을 구분해 표시한다.
- 현재 확인 결과: 백엔드 원본 가이드의 `WholesaleOwnedStore`와 `SellerBusinessStore`에는 사용자 필드가 추가됐지만, 관리자 `WholesaleStore`·`RetailStore` 계약과 실제 `WholesaleStoreResDTO`·`RetailStoreResDTO`에는 아직 없다.
- 프론트 처리: 두 목록에 사용자 ID·사용자명 열을 추가하고 nullable 필드로 수용한다. 백엔드 응답에 필드가 없으면 `-`로 표시한다.
- 확정 요청: 관리자 매장 응답에도 사업자 프로필 대표 사용자의 세 필드를 추가하고 nullable 기준을 확정해 `docs/frontend-api-guide.md` 13.2에 반영해 달라.

## API-016 도매 재고 목록 출고 누계

- 상태: 해결 (2026-09-10)
- 대상: `GET /api/v1/wholesale/inventory`
- 필요 필드: 각 `WholesaleInventory` 응답의 `shippedQuantity: number`
- 확정 결과: `WholesaleInventoryResDTO`가 `Inventory.getShippedQuantity()`를 `shippedQuantity`로 반환하며 백엔드 가이드의 `WholesaleInventory` 계약에도 필수 숫자 필드로 추가됐다.
- 프론트 반영: 도매 재고 관리의 요약 영역과 SKU 목록에서 출고 누계를 숫자로 표시한다.

## API-017 도매 출고 품목 옵션 정보

- 상태: 해결 (2026-09-10)
- 대상: `GET /api/v1/wholesale/shipments`, 출고 상태·수량 변경 성공 응답의 `Shipment.items[]`
- 필요 필드: `sku: string | null`, `color: string | null`, `size: string | null`
- 확정 결과: 출고 응답과 백엔드 가이드에 주문 시점 옵션 snapshot 기반 `sku`, `color`, `size`가 추가됐다.
- 프론트 반영: 출고 관리 품목 표에 SKU와 색상·사이즈 옵션을 표시한다.

## API-018 셀러 매장 등록·수정

- 상태: 해결 (2026-09-15, `COMMERCE_SellerMenuMove_002`)
- 대상: `POST /api/v1/seller/stores`, `PUT /api/v1/seller/stores/{storeSeq}`
- 확정 필드: 등록은 `businessProfileSeq`, `storeName`, nullable `salesChannel`, `status`; 수정은 사업자 연결을 제외한 나머지 필드만 전송한다.
- 확정 로직: GET 사업자 목록의 본인 사업자만 등록할 수 있고 수정은 본인 소유 매장만 허용한다. 매장명은 최대 150자, 판매 채널은 최대 50자, 상태는 `ACTIVE | INACTIVE`다.
- 프론트 반영: 셀러 사업자·매장 관리에서 사업자를 선택해 레이어 팝업으로 등록하고, 기존 매장은 사업자 연결을 고정해 수정한다. 성공 후 목록 GET만 재시도할 수 있으며 저장 요청은 자동 재전송하지 않는다.

## API-019 도매 관리자 운영 고도화 계약

- 상태: 부분 해결 (2026-09-21, `COMMERCE_ApiGuideSync_011`)
- 목적: 도매 주문·출고 일괄 처리, 재고 추적, 운영 대시보드, 정산 상세, 상품 파일 업로드와 클레임 증빙을 구현한다.
- 권한: 모든 API는 `ROLE_WHOLESALE`, `ROLE_ADMIN`, `ROLE_SYSTEMADMIN`만 허용하고 도매 사용자는 본인 소유 도매 매장으로 제한한다. 타 소유 매장은 기존 `404 WS001` 계약을 유지한다.
- 공통 목록: `PageResponse<T>`, `page=0`, `size=20`, 최대 100을 적용한다. 날짜는 서비스 기준일(`Asia/Seoul`)의 `yyyy-MM-dd` query로 전달한다.

### API-019-A 주문·출고 검색 및 일괄 처리

- 상태: 부분 해결. 주문 검색·기본 주문 상세·주문 품목 다건 상태 변경·출고 다건 완료·배송조회 URL 계약은 백엔드 원본 가이드에 확정되어 프론트에 반영했다.

- 주문 목록 확장: `GET /api/v1/wholesale/orders`에 선택 query `keyword`, `orderedFrom`, `orderedTo`를 추가한다. `keyword`는 주문번호, 소매 매장명, 구매 사업자명, 상품명, SKU를 대상으로 한다.
- 주문 상세: `GET /api/v1/wholesale/orders/{orderSeq}`는 현재 `WholesaleOrder`를 반환하는 기본 계약만 확정됐다. 상태 이력, 연결 출고와 클레임을 포함하는 확장 DTO는 계속 확인이 필요하다.
- 주문 품목 일괄 변경: `PATCH /api/v1/wholesale/orders/items/status`, body `{ "items": [{ "orderSeq": number, "orderItemSeq": number }], "status": "PRODUCT_PREPARING" | "PRODUCT_READY" }`.
- 출고 일괄 완료: `PATCH /api/v1/wholesale/shipments/status`, body `{ "shipments": [{ "shipmentSeq": number, "deliveryCompanyCode": string, "trackingNumber": string }], "status": "SHIPPED" }`.
- 일괄 응답은 HTTP `200`과 `{ succeeded: T[], failed: { seq: number, code: string, message: string }[] }` 구조를 사용해 부분 성공을 명확히 구분한다. 전체 요청 형식이 잘못된 경우만 `400`을 반환한다.
- 택배사 선택 응답에 nullable `trackingUrlTemplate`을 추가한다. 프론트가 택배사별 외부 URL을 하드코딩하지 않도록 한다.
- 피킹리스트·포장명세서에 필요한 주문 snapshot 필드 범위를 확정한다. 서버 PDF를 제공한다면 다운로드 경로와 파일명을 함께 확정한다.

### API-019-B 안전재고·재고 원장

- 재고 목록에 선택 query `wholesaleStoreSeq`, `keyword`, `stockStatus=OUT_OF_STOCK|LOW_STOCK|HAS_RESERVED`를 추가한다.
- 재고 응답에 `safetyStockQuantity: number`와 계산 상태 `stockStatus`를 추가한다.
- 안전재고 변경: `PATCH /api/v1/wholesale/inventory/{inventorySeq}/safety-stock`, body `{ "quantity": number }`.
- 재고 원장: `GET /api/v1/wholesale/inventory/{inventorySeq}/ledger?page=&size=&type=&from=&to=`. 필수 필드는 `seq`, `inventorySeq`, `type`, `quantityDelta`, `beforeQuantity`, `afterQuantity`, nullable `referenceType`, nullable `referenceSeq`, nullable `reason`, `createdAt`이다.
- 수동 조정: `POST /api/v1/wholesale/inventory/{inventorySeq}/adjustments`, body `{ "quantityDelta": number, "reason": string }`. 서버가 현재 수량을 잠금·재검증해 결과 수량을 반환한다.
- 현재 필터 전체 CSV 다운로드 API와 최대 다운로드 건수, UTF-8 BOM 여부를 확정한다.

### API-019-C 대시보드 상세 통계

- `GET /api/v1/wholesale/management/dashboard?wholesaleStoreSeq=&from=&to=`로 확장한다.
- 기존 필드를 유지하고 `new_order_count`, `preparing_item_count`, `pending_shipment_count`, `order_amount`, `order_count`, `sold_quantity`, 비교 기간 증감률, 상위 상품 5건, 상위 거래처 5건, 최근 주문·클레임을 추가한다.
- 금액은 정수 원 단위, 증감률은 nullable 숫자로 정의한다. 이전 기간 분모가 0이면 `null`을 반환한다.

### API-019-D 정산 상세·정산서

- 정산 목록에 `wholesaleStoreSeq`, `status`, `periodFrom`, `periodTo` query와 페이지 응답을 적용한다.
- `GET /api/v1/wholesale/management/settlements/{settlementSeq}`에 포함 주문, 총 거래액, 수수료, 취소·반품 공제, 기타 조정, 지급 예정액과 상태 이력을 반환한다.
- `GET /api/v1/wholesale/management/settlements/{settlementSeq}/statement`의 PDF 다운로드 계약, 파일명과 오류 응답을 확정한다.
- 실제 지급·PG 환불·세금계산서 처리는 별도 계약으로 분리한다.

### API-019-E 상품 이미지·일괄 작업

- 상품 이미지 업로드/삭제 API, 허용 MIME·크기·개수, 임시 업로드 만료와 고아 파일 정리 정책을 확정한다.
- 상품 복제 API는 이미지 참조 복제 여부와 신규 상품 초기 상태를 확정한다.
- 상품 일괄 상태 변경과 SKU 가격·최소 주문 수량 일괄 변경은 부분 성공 구조를 사용한다.
- 파일 업로드 API를 제외한 JSON 요청은 기존 `Content-Type: application/json`을 유지한다.

### API-019-F 클레임·거래처 상세

- 클레임 상세에 증빙 파일, 처리 사유, 회수 택배사·송장, 재고 복구 여부, 환불 상태를 추가한다.
- 상태 변경 요청에 필요한 사유 필수 조건과 `APPROVED → COMPLETED` 시 재고 복구 시점을 확정한다.
- 거래처 목록에 keyword·정렬·페이지 query를 추가하고 거래처 상세 주문 목록과 내부 메모·등급 API를 분리한다.
- 거래처별 가격 정책과 신용 한도는 별도 업무 승인 전 API-019 범위에 포함하지 않는다.

프론트 상세 화면, 단계별 구현 순서와 완료 조건은 `docs/COMMERCE_WholesaleAdminEnhancement_001_frontend-development-plan.html`을 따른다. 계약 확정 전에는 운영 요청 경로를 추측해 호출하지 않고 mock 또는 비활성 UI로만 개발한다.

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
