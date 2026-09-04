# Commerce 프론트엔드 API 개발 가이드

> 최종 갱신일: 2026-08-25  
> 대상 API: Commerce Backend `/api/v1`  
> 문서 상태: 현재 백엔드 구현 기준

## 1. 문서 사용 원칙

- 프론트엔드는 이 문서를 API 연동 계약의 빠른 참조 자료로 사용한다.
- 실제 구현의 최종 기준은 백엔드 Controller, 요청/응답 VO 및 공통 오류 응답 클래스다.
- API 경로, 요청/응답 필드, 인증 방식 또는 상태 처리 기준이 변경되면 백엔드 변경과 함께 이 문서도 갱신한다.
- 문서의 `확정` 항목은 구현에 사용해도 된다.
- `주의` 또는 `미확정` 항목은 프론트에서 값을 하드코딩하지 말고 백엔드 담당자와 합의한다.

## 2. 공통 통신 규칙

### 2.1 Base URL

환경별 API 주소는 프론트 환경 변수로 관리한다.

```env
VITE_API_BASE_URL=https://api.example.com
```

```ts
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
```

### 2.2 Content-Type

JSON API 요청은 다음 헤더를 사용한다.

```http
Content-Type: application/json
```

파일 업로드 API는 별도 명시가 없는 한 `multipart/form-data`를 사용한다.

### 2.3 인증 헤더

인증이 필요한 API는 로그인 응답의 `accessToken`을 Bearer 토큰으로 전달한다.

```http
Authorization: Bearer {accessToken}
```

토큰 앞의 `Bearer`와 토큰 사이에는 공백이 하나 필요하다.

### 2.4 날짜 및 시간

현재 사용자 API의 날짜·시간 필드는 Java `LocalDateTime` 기반이며 UTC offset이 없는 ISO-8601 문자열로 전달된다.

```text
2026-07-24T15:30:45
```

프론트 처리 기준:

- 값이 `null`일 수 있으므로 nullable로 선언한다.
- 문자열 끝에 `Z` 또는 `+09:00`이 없으므로 임의로 UTC로 해석하지 않는다.
- 화면 표시는 서비스 기준 시간대인 `Asia/Seoul`로 취급한다.

### 2.5 식별자 필드 명명 규칙

- 로그인 아이디인 `userId`만 `Id` 접미사를 유지한다.
- DB의 관계 참조는 `*_seq`, JSON/TypeScript의 관계 참조는 `*Seq`를 사용한다.
- 상품 API의 기존 `wholesaleStoreId`는 요청·응답·검색 파라미터 모두
  `wholesaleStoreSeq`로 변경됐다. 기존 필드는 더 이상 전송하지 않는다.
- `pgTransactionId`, `requestId`, `deviceId`는 다른 테이블의 `seq`를 참조하는 값이 아니라
  PG·요청 추적·클라이언트 장치의 외부 식별자이므로 이름을 유지한다.

프론트 변경 필드:

| 사용 위치 | 이전 | 현재 | 타입 |
|---|---|---|---|
| `GET /api/v1/products` 검색 파라미터 | `wholesaleStoreId` | `wholesaleStoreSeq` | `number?` |
| 상품 등록/수정 요청 | `wholesaleStoreId` | `wholesaleStoreSeq` | `number` |
| 상품 목록/상세 응답 | `wholesaleStoreId` | `wholesaleStoreSeq` | `number` |

그 밖의 관계 필드는 이미 `retailStoreSeq`, `orderSeq`, `paymentSeq`, `shipmentSeq`,
`settlementSeq`, `orderItemSeq`, `productSeq`, `variantSeq`, `categorySeq` 계약으로 노출된다.

## 3. 공통 응답 계약

메뉴 화면의 목록 API는 다음 페이지 구조를 직접 반환한다. `page` 기본값은 `0`, `size` 기본값은
`20`이고 최대 `100`이다. 카테고리 트리, 장바구니, 공통 코드 및 화면 select용 소유 매장·활성
택배사 목록은 전체 배열 계약을 유지한다.

```ts
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
```

### 3.1 정상 응답

```ts
export interface ApiResponse<T> {
  status: number;
  message: string;
  code: number;
  data: T;
  dataTime: string;
  httpStatus: string;
}
```

예시:

```json
{
  "status": 200,
  "message": "OK",
  "code": 1000,
  "data": {},
  "dataTime": "2026-07-24 15:30:45",
  "httpStatus": "OK"
}
```

처리 기준:

1. 성공 여부는 HTTP Status를 우선 확인한다.
2. 업무 결과의 세부 구분이 필요할 때 `code`를 확인한다.
3. 사용자에게 표시할 기본 메시지는 `message`를 사용한다.
4. `httpStatus`는 표시용으로 사용하지 않는다.

### 3.2 예외 응답

`CustomException`이 발생하면 정상 응답과 다른 구조가 반환된다.

```ts
export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  code: string;
  message: string;
}
```

예시:

```json
{
  "timestamp": "2026-07-24T15:30:45.123",
  "status": 409,
  "error": "CONFLICT",
  "code": "DUPLICATE_USER",
  "message": "이미 가입되어 있는 유저 입니다."
}
```

프론트 공통 오류 메시지 선택 순서:

```ts
const message =
  error.response?.data?.message ??
  "요청 처리 중 오류가 발생했습니다.";
```

### 3.3 HTTP 상태별 공통 처리

| HTTP Status | 의미 | 프론트 처리 기준 |
|---:|---|---|
| `200` | 정상 조회·처리 | 응답 데이터를 반영한다. |
| `201` | 등록 성공 | 성공 화면 또는 다음 단계로 이동한다. |
| `400` | 요청값 오류 | 입력값을 유지하고 오류 메시지를 표시한다. |
| `401` | 인증 실패·만료 | 토큰 재발급을 시도하고 실패하면 로그아웃한다. |
| `403` | 로그인 실패 또는 접근 거부 | 로그인 오류 또는 권한 안내를 표시한다. |
| `404` | 사용자·필수 데이터 없음 | `code`에 따라 필드 오류 또는 Not Found를 처리한다. |
| `409` | 중복·상태 충돌 | 해당 입력 필드 또는 충돌 안내를 표시한다. |
| `500` | 서버 오류 | 공통 오류 알림을 표시하고 재시도 수단을 제공한다. |

## 4. 사용자 데이터 모델

```ts
export type UserStatus = string;

export interface User {
  seq: number;
  userId: string | null;
  passwd: string | null;
  phone: string;
  name: string;
  status: UserStatus;
  businessType: 'WHOLESALE' | 'RETAIL';
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}
```

주의:

- 응답의 `passwd`는 실제 비밀번호가 아니라 `"****"`로 마스킹된다.
- 프론트 상태 저장소에는 `passwd`를 보관하지 않는다.
- `status` 허용값 목록은 아직 백엔드에서 enum으로 확정되지 않았다.
- 신규 가입의 기본 상태는 `PENDING`이다.

## 5. 사용자 API

### 5.1 회원가입

#### 계약

```http
POST /api/v1/users/sign
```

- 인증: 불필요
- 성공 HTTP Status: `201 Created`

#### 요청

```ts
export interface SignUpRequest {
  userId: string;
  passwd: string;
  phone: string;
  name: string;
  businessType: 'WHOLESALE' | 'RETAIL';
  status?: string;
}
```

```json
{
  "userId": "test-user-01",
  "passwd": "password1234!",
  "phone": "01012345678",
  "name": "테스트 사용자",
  "businessType": "RETAIL"
}
```

#### 필드 검증

| 필드 | 필수 | 최대 길이 | 프론트 처리 |
|---|---:|---:|---|
| `userId` | Y | 255 | 앞뒤 공백을 제거한다. |
| `passwd` | Y | 500 | 공백 여부를 확인하고 로그에 남기지 않는다. |
| `phone` | Y | 30 | 앞뒤 공백을 제거한다. |
| `name` | Y | 100 | 앞뒤 공백을 제거한다. |
| `businessType` | Y | 20 | `WHOLESALE` 또는 `RETAIL`만 전송한다. |
| `status` | N | 30 | 일반 회원가입 화면에서는 전송하지 않는다. |

`seq`, `lastLoginAt`, `createdAt`, `updatedAt`은 서버 관리 필드이므로 회원가입 요청에 포함하지 않는다.

#### 성공 응답

```json
{
  "status": 201,
  "message": "OK",
  "code": 1000,
  "data": {
    "seq": 1,
    "userId": "test-user-01",
    "passwd": "****",
    "phone": "01012345678",
    "name": "테스트 사용자",
    "status": "PENDING",
    "businessType": "RETAIL",
    "lastLoginAt": null,
    "createdAt": "2026-07-24T15:30:45",
    "updatedAt": "2026-07-24T15:30:45"
  },
  "dataTime": "2026-07-24 15:30:45",
  "httpStatus": "CREATED"
}
```

#### 오류 처리

| HTTP Status | 오류 코드 | 상황 | 프론트 처리 |
|---:|---|---|---|
| `400` | `INVALID_VALUE_REQUEST` | 최대 길이 초과 등 | 해당 입력값을 확인하도록 안내한다. |
| `404` | `REQUIRED_DATA_NOT_FOUND` | 필수값 누락 | 누락된 필드를 검증한다. |
| `409` | `DUPLICATE_USER` | 사용자 ID 중복 | `userId` 입력란에 중복 오류를 표시한다. |

#### 화면 상태

```ts
type SignUpViewState =
  | "idle"
  | "submitting"
  | "success"
  | "validation-error"
  | "duplicate-user"
  | "server-error";
```

저장 버튼은 `submitting` 동안 비활성화하여 중복 등록을 방지한다.

### 5.2 로그인

#### 계약

```http
POST /api/v1/users/login
```

- 인증: 불필요
- 성공 HTTP Status: `200 OK`

#### 요청

```ts
export interface LoginRequest {
  userId: string;
  passwd: string;
}
```

```json
{
  "userId": "test-user-01",
  "passwd": "password1234!"
}
```

#### 성공 응답

```ts
export interface LoginResponse {
  grantType: "Bearer";
  accessToken: string;
  accessTokenExpiresIn: number;
  businessType: 'WHOLESALE' | 'RETAIL';
  roles: Array<'RETAILER' | 'WHOLESALER' | 'ADMIN'>;
  adminScopes: Array<'WHOLESALE' | 'RETAIL'>;
  landingPage: 'WHOLESALE_ADMIN' | 'SERVICE_MAIN' | 'ADMIN_HOME';
}
```

```json
{
  "status": 200,
  "message": "OK",
  "code": 1000,
  "data": {
    "grantType": "Bearer",
    "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
    "accessTokenExpiresIn": 1784878245000,
    "businessType": "WHOLESALE",
    "roles": ["WHOLESALER"],
    "adminScopes": ["WHOLESALE"],
    "landingPage": "WHOLESALE_ADMIN"
  },
  "dataTime": "2026-07-24 15:30:45",
  "httpStatus": "OK"
}
```

`accessTokenExpiresIn`은 남은 초가 아니라 만료 시각의 Unix epoch millisecond다.

로그인 성공 후 `landingPage` 기준으로 이동한다. `WHOLESALE_ADMIN`은 도매관리 화면,
`SERVICE_MAIN`은 서비스 메인, `ADMIN_HOME`은 통합 관리자 화면을 뜻한다. 관리 메뉴는
`adminScopes`로 필터링하며 `ADMIN`은 도매·소매 메뉴를 모두 노출한다.

```ts
const expiresAt = response.data.data.accessTokenExpiresIn;
const remainingMs = Math.max(0, expiresAt - Date.now());
```

#### 로그인 실패

로그인 실패는 현재 HTTP `403`과 정상 응답 envelope 형식으로 반환된다.

| HTTP Status | 업무 코드 | 상황 |
|---:|---:|---|
| `403` | `2000` | 가입되지 않은 사용자 ID |
| `403` | `2047` | 비밀번호 불일치 |
| `403` | `2048` | 사용 불가능한 회원 상태 |

```json
{
  "status": 403,
  "message": "비밀번호가 정확하지 않습니다.",
  "code": 2047,
  "data": null,
  "dataTime": "2026-07-24 15:31:00",
  "httpStatus": "FORBIDDEN"
}
```

### 5.3 현재 사용자 조회

#### 계약

```http
GET /api/v1/users/info
Authorization: Bearer {accessToken}
```

- 인증: 필요
- 성공 HTTP Status: `200 OK`
- 응답 `data`: `User`

비밀번호 응답은 `"****"`이므로 화면이나 스토어에서 사용하지 않는다.

### 5.4 Access Token 재발급

#### 계약

```http
POST /api/v1/users/refresh-token
Authorization: Bearer {기존 accessToken}
Content-Type: application/json

{}
```

- 인증: SecurityContext 인증은 불필요
- 기존 access token이 만료됐더라도 헤더에 전달해야 한다.
- 서버에 저장된 refresh token을 검증한 후 새 access token을 반환한다.
- refresh token 자체는 프론트에 반환되지 않는다.

#### 만료 시 처리 순서

1. 일반 API가 HTTP `401`을 반환하거나 `accessTokenExpiresIn <= Date.now()`이면 재발급을 시작한다.
2. 만료된 기존 access token을 삭제하지 않고 `/refresh-token`의 Bearer 헤더로 전달한다.
3. 요청 body는 빈 객체 `{}`를 전송한다.
4. 성공 응답의 `data.accessToken`, `data.accessTokenExpiresIn`으로 인증 상태를 교체한다.
5. 실패했던 원래 요청의 Authorization 헤더를 새 토큰으로 바꾸고 한 번만 재시도한다.
6. 재발급이 실패하면 토큰과 사용자 상태를 모두 제거하고 로그인 화면으로 이동한다.

서버는 기존 access token의 `jti`로 DB에 저장된 활성 refresh token을 찾는다. refresh token의
교체 시점이 지나면 서버 내부에서 refresh token도 rotation하지만, refresh token 문자열은
프론트에 전달하지 않는다. 프론트가 저장하고 관리하는 값은 access token뿐이다.

#### 성공 응답

성공 HTTP Status는 `200 OK`이며 `data` 구조는 로그인 응답과 같다.

```json
{
  "status": 200,
  "message": "OK",
  "code": 1000,
  "data": {
    "grantType": "Bearer",
    "accessToken": "eyJhbGciOiJIUzUxMiJ9.reissued...",
    "accessTokenExpiresIn": 1785301200000
  },
  "dataTime": "2026-07-29 10:00:00",
  "httpStatus": "OK"
}
```

`accessTokenExpiresIn`은 유효시간(초)이 아니라 새 access token의 만료 시각을 나타내는 Unix
epoch millisecond다.

#### 재발급 실패 처리

- HTTP `401` 또는 토큰 관련 오류가 반환되면 로컬 인증 상태를 제거한다.
- 재발급 API 자체에 대해 다시 재발급을 시도하지 않는다.
- 동시에 여러 API가 `401`을 반환하면 재발급 요청은 하나만 수행하고 나머지는 대기시킨다.
- 재발급에 사용할 기존 access token은 재발급 요청이 끝날 때까지 보존한다.
- 원래 API 요청은 최대 한 번만 재시도한다.

#### Axios 구현 예시

동시 `401`을 하나의 재발급 요청으로 합치고 무한 루프를 방지하는 예시다.

```ts
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let refreshPromise: Promise<string> | null = null;

function requestNewAccessToken(expiredAccessToken: string): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<ApiResponse<LoginResponse>>(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/users/refresh-token`,
        {},
        {
          headers: {
            Authorization: `Bearer ${expiredAccessToken}`,
            "Content-Type": "application/json",
          },
        },
      )
      .then(({ data }) => {
        authStore.setToken(data.data.accessToken, data.data.accessTokenExpiresIn);
        return data.data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableRequestConfig | undefined;
    const isRefreshRequest = config?.url?.includes("/api/v1/users/refresh-token");

    if (error.response?.status !== 401 || !config || config._retry || isRefreshRequest) {
      return Promise.reject(error);
    }

    const expiredAccessToken = authStore.accessToken;
    if (!expiredAccessToken) {
      authStore.clear();
      return Promise.reject(error);
    }

    config._retry = true;

    try {
      const newAccessToken = await requestNewAccessToken(expiredAccessToken);
      config.headers.Authorization = `Bearer ${newAccessToken}`;
      return api.request(config);
    } catch (refreshError) {
      authStore.clear();
      router.replace("/login");
      return Promise.reject(refreshError);
    }
  },
);
```

### 5.5 로그아웃

#### 계약

```http
POST /api/v1/users/logout
Authorization: Bearer {accessToken}
Content-Type: application/json

{}
```

- 인증: 필요
- 성공 HTTP Status: `200 OK`
- 서버에서 해당 토큰을 `REVOKED` 상태로 변경한다.

프론트는 로그아웃 API 성공 여부와 관계없이 로컬 인증 정보를 제거해야 한다.

```ts
try {
  await logout();
} finally {
  authStore.clear();
  router.replace("/login");
}
```

## 6. 카테고리 API

### 6.1 카테고리 타입

```ts
export interface Category {
  seq: number;
  parentSeq: number | null;
  depth: number;
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  children: Category[];
}
```

### 6.2 카테고리 트리 목록

```http
GET /api/v1/categories?activeOnly=true
Authorization: Bearer {accessToken}
```

| 파라미터 | 필수 | 기본값 | 설명 |
|---|---:|---:|---|
| `activeOnly` | N | `true` | `true`면 활성 카테고리만 조회 |

응답은 루트 카테고리부터 시작하는 재귀 `children` 구조다.

```json
[
  {
    "seq": 1,
    "parentSeq": null,
    "depth": 1,
    "code": "OUTER",
    "name": "아우터",
    "sortOrder": 1,
    "isActive": true,
    "children": [
      {
        "seq": 2,
        "parentSeq": 1,
        "depth": 2,
        "code": "OUTER_COAT",
        "name": "코트",
        "sortOrder": 1,
        "isActive": true,
        "children": []
      }
    ]
  }
]
```

### 6.3 카테고리 등록

```http
POST /api/v1/categories
Authorization: Bearer {accessToken}
Content-Type: application/json
```

```ts
export interface CategoryCreateRequest {
  parentSeq: number | null;
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}
```

- 루트 카테고리는 `parentSeq: null`로 전송한다.
- 하위 카테고리는 상위 카테고리의 `seq`를 `parentSeq`로 전송한다.
- `depth`는 서버 DB 트리거가 자동 계산하므로 전송하지 않는다.
- 성공 HTTP Status: `201`

### 6.4 카테고리 수정

```http
PUT /api/v1/categories/{categorySeq}
Authorization: Bearer {accessToken}
Content-Type: application/json
```

요청 구조는 `CategoryCreateRequest`와 같다. `PUT` 방식이므로 전체 필드를 전송한다.

- 부모 변경 시 해당 카테고리와 모든 하위 카테고리의 depth가 자동 재계산된다.
- 자기 자신 또는 자신의 하위 카테고리를 부모로 지정할 수 없다.
- 성공 HTTP Status: `200`

### 6.5 카테고리 오류 처리

| HTTP Status | 코드 | 상황 | 프론트 처리 |
|---:|---|---|---|
| `400` | `C001` | 필드 검증 실패 | `errors[].field`를 입력 컴포넌트에 연결 |
| `404` | `CAT001` | 카테고리 또는 부모 없음 | 목록을 갱신하고 Not Found 안내 |
| `409` | `CAT002` | 코드·동일 부모 이름·계층 충돌 | 입력값 또는 부모 선택 오류 표시 |

## 7. 상품 API

상품 API는 `products`, `product_images`, `product_options`, `product_variants`,
`product_views`를 하나의 상품 aggregate로 조회·저장한다. 공통 `ApiResponse<T>` envelope가
아닌 응답 DTO를 직접 반환한다.

현재 구현으로 확인된 공통 계약:

- Base path: `/api/v1/products`
- 인증: 목록·상세·등록·수정 모두 필수. `Authorization: Bearer {accessToken}`을 전송한다.
- 권한: 로그인 사용자라면 접근 가능하다. 단, `ROLE_WHOLESALE` 사용자는 자신이 소유한 도매 매장 범위로 상품 목록·상세·등록·수정이 제한된다. `ROLE_ADMIN`/`ROLE_SYSTEMADMIN`이 함께 있으면 전체 관리 범위를 유지하며, `ROLE_RETAIL`의 상품 탐색 범위도 제한하지 않는다.
- 등록·수정 Content-Type: `application/json`. 이미지 파일이 아니라 업로드 완료된 URL을 전송한다.
- 개발용 `SEED-*` 상품과 도매사별 로컬 상품 이미지는 DB에
  `/mock/products/**` 상대 경로로 저장되지만, API 응답의 `imageUrl`은 현재 API 서버 origin이
  포함된 절대 URL로 제공된다. `/mock/**` 정적 이미지는 인증 헤더 없이 조회할 수 있으므로
  프론트는 응답값을 그대로 `<img src>`에 사용한다.
- 성공 응답: 공통 `ApiResponse`로 감싸지 않은 DTO 원문이다.
- 금액: JSON number이며 프론트에서는 원 단위 정수 입력을 권장한다.
- 상태 허용 목록: 아직 enum으로 확정되지 않았다. 현재 기본값은 상품 `DRAFT`, SKU `ACTIVE`다.

### 7.1 상품 타입

```ts
export interface Product {
  seq: number;
  wholesaleStoreSeq: number;
  wholesaleStoreName: string | null;
  categorySeq: number;
  name: string;
  description: string | null;
  status: string;
  minOrderQuantity: number;
  createdAt: string;
  updatedAt: string;
  images: ProductImage[];
  options: ProductOption[];
  variants: ProductVariant[];
  viewCount: number;
}

export interface ProductImage {
  seq: number;
  imageUrl: string;
  imageType: string;
  sortOrder: number;
}

export interface ProductOption {
  seq: number;
  optionName: string;
  optionValue: string;
  sortOrder: number;
}

export interface ProductVariant {
  seq: number;
  sku: string;
  color: string | null;
  size: string | null;
  supplyPrice: number;
  salePrice: number;
  status: string;
}

export interface ProductPage {
  content: Product[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
```

날짜·시간 값은 PostgreSQL `timestamp with time zone`에 대응하는 ISO-8601 offset 문자열이다.

```text
2026-07-25T10:30:00+09:00
```

### 7.2 상품 목록

```http
GET /api/v1/products
Authorization: Bearer {accessToken}
```

쿼리 파라미터:

| 이름 | 필수 | 기본값 | 설명 |
|---|---:|---:|---|
| `page` | N | `0` | 0부터 시작하는 페이지 번호 |
| `size` | N | `20` | 페이지 크기. 서버 최대값 `100` |
| `wholesaleStoreSeq` | N |  | 도매상 `seq` 일치 검색 |
| `categorySeq` | N |  | 선택 카테고리 자신과 모든 하위 카테고리를 포함한 검색 |
| `status` | N |  | 상품 상태 일치 검색 |
| `name` | N |  | 상품명 대소문자 무시 부분 검색 |

정렬은 `createdAt DESC`로 고정되어 있다.

프론트 처리 기준:

- `page < 0`은 `0`, `size < 1`은 `1`, `size > 100`은 `100`으로 서버에서 보정한다.
- `status`는 완전 일치 검색이고 `name`은 대소문자를 무시한 부분 일치 검색이다.
- 1depth `categorySeq`를 보내면 해당 1depth와 모든 하위 카테고리의 상품이 함께 조회된다. 2depth 또는 더 하위 카테고리도 동일하게 자신과 자손 범위로 조회된다.
- 목록 항목에도 `images`, `options`, `variants`, `viewCount`가 모두 포함된다.
- 목록과 상세의 `wholesaleStoreName`은 `wholesaleStoreSeq`에 해당하는 도매 매장명이다. 참조 매장이 없으면 `null`이다.
- 이미지는 `sortOrder ASC, seq ASC`, 옵션은 `sortOrder ASC, seq ASC`, SKU는 `seq ASC` 순서다.
- 대표 이미지는 `images[0]`을 사용하되 빈 배열에 대비해 fallback 이미지를 준비한다.
- 서버의 목록 동적 조건과 페이징은 QueryDSL로 처리되며 기존 요청·응답 계약에는 영향이 없다.
- 도매 관리자(`ROLE_WHOLESALE`)가 `wholesaleStoreSeq`를 생략하면 로그인 사용자가 소유한 모든 도매 매장의 상품만 반환한다. 다른 사용자의 매장 `seq`를 보내면 HTTP `404`, `WS001`로 거부한다.
- 도매 관리자의 상세 조회·등록·수정도 같은 소유권 검사를 적용한다. 수정 시 기존 상품의 소유 매장과 요청의 `wholesaleStoreSeq`가 모두 로그인 사용자 소유여야 한다.

```http
GET /api/v1/products?page=0&size=20&status=DRAFT&name=셔츠
```

성공 응답:

```json
{
  "content": [
    {
      "seq": 1,
      "wholesaleStoreSeq": 10,
      "wholesaleStoreName": "테스트 도매상",
      "categorySeq": 3,
      "name": "기본 셔츠",
      "description": "상품 상세 설명",
      "status": "DRAFT",
      "minOrderQuantity": 2,
      "createdAt": "2026-07-25T10:30:00+09:00",
      "updatedAt": "2026-07-25T10:30:00+09:00",
      "images": [],
      "options": [],
      "variants": [],
      "viewCount": 0
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1
}
```

빈 목록은 오류가 아니라 `content: []`, `totalElements: 0`으로 처리한다.

### 7.3 상품 상세

```http
GET /api/v1/products/{productSeq}
Authorization: Bearer {accessToken}
```

- 성공 HTTP Status: `200`
- 응답: `Product`
- 없는 상품: HTTP `404`, 오류 코드 `P001`

성공 응답 예시:

```json
{
  "seq": 120,
  "wholesaleStoreSeq": 1,
  "wholesaleStoreName": "동대문 테스트 도매상",
  "categorySeq": 8,
  "name": "SEED-017 슬림핏 티셔츠",
  "description": "상품 상세 설명",
  "status": "ACTIVE",
  "minOrderQuantity": 2,
  "createdAt": "2026-07-28T21:30:00+09:00",
  "updatedAt": "2026-07-28T21:30:00+09:00",
  "images": [
    {"seq": 11, "imageUrl": "https://cdn.example.com/products/120/1.jpg", "imageType": "DETAIL", "sortOrder": 0}
  ],
  "options": [
    {"seq": 21, "optionName": "색상", "optionValue": "블랙", "sortOrder": 0},
    {"seq": 22, "optionName": "사이즈", "optionValue": "M", "sortOrder": 1}
  ],
  "variants": [
    {"seq": 31, "sku": "SEED-017-BLK-M", "color": "블랙", "size": "M", "supplyPrice": 26000, "salePrice": 39000, "status": "ACTIVE"}
  ],
  "viewCount": 15
}
```

상세 화면에서 조회수를 기록하려면 상세 조회 성공 후 `POST /{productSeq}/views`를 별도로 호출한다.

### 7.4 상품 등록

```http
POST /api/v1/products
Authorization: Bearer {accessToken}
Content-Type: application/json
```

```ts
export interface ProductCreateRequest {
  wholesaleStoreSeq: number;
  categorySeq: number;
  name: string;
  description?: string | null;
  status?: string;
  minOrderQuantity?: number;
  images: ProductImageRequest[];
  options: ProductOptionRequest[];
  variants: ProductVariantRequest[];
}

export interface ProductImageRequest {
  seq?: number; // 등록 시 금지, 수정 시 기존 행 유지에 사용
  imageUrl: string;
  imageType?: string;
  sortOrder?: number;
}

export interface ProductOptionRequest {
  seq?: number; // 등록 시 금지, 수정 시 기존 행 유지에 사용
  optionName: string;
  optionValue: string;
  sortOrder?: number;
}

export interface ProductVariantRequest {
  seq?: number; // 등록 시 금지, 수정 시 기존 행 유지에 사용
  sku: string;
  color?: string | null;
  size?: string | null;
  supplyPrice?: number;
  salePrice?: number;
  status?: string;
}
```

```json
{
  "wholesaleStoreSeq": 10,
  "categorySeq": 3,
  "name": "기본 셔츠",
  "description": "상품 상세 설명",
  "status": "DRAFT",
  "minOrderQuantity": 2,
  "images": [
    {"imageUrl": "https://cdn.example.com/products/1/main.jpg", "imageType": "DETAIL", "sortOrder": 0}
  ],
  "options": [
    {"optionName": "색상", "optionValue": "블랙", "sortOrder": 0}
  ],
  "variants": [
    {"sku": "SHIRT-BLACK-M", "color": "블랙", "size": "M", "supplyPrice": 10000, "salePrice": 15000}
  ]
}
```

필드 규칙:

| 필드 | 필수 | 규칙 |
|---|---:|---|
| `wholesaleStoreSeq` | Y | 1 이상의 정수 |
| `categorySeq` | Y | 1 이상의 정수 |
| `name` | Y | 공백 불가, 최대 200자 |
| `description` | N | 빈 문자열은 `null`로 정규화 |
| `status` | N | 최대 30자, 생략 시 `DRAFT` |
| `minOrderQuantity` | N | 1 이상, 생략 시 `1` |
| `images` | Y | 빈 배열 허용. 현재 확인된 `imageType` 허용값은 `DETAIL`, `sortOrder` 기본값 `0` |
| `options` | Y | 빈 배열 허용. 이름 50자, 값 100자 이하 |
| `variants` | Y | 빈 배열 허용. `sku` 필수·80자 이하, 가격은 0 이상, `status` 기본값 `ACTIVE` |

등록 시 하위 항목의 `seq`는 보내지 않는다.
대표 이미지는 별도 `MAIN` 타입이 아니라 `sortOrder: 0`인 첫 이미지로 처리한다.

- 성공 HTTP Status: `201`
- 응답: 생성된 `Product`

### 7.5 상품 수정

```http
PUT /api/v1/products/{productSeq}
Authorization: Bearer {accessToken}
Content-Type: application/json
```

```ts
export interface ProductUpdateRequest {
  wholesaleStoreSeq: number;
  categorySeq: number;
  name: string;
  description?: string | null;
  status?: string;
  minOrderQuantity: number;
  images: ProductImageRequest[];
  options: ProductOptionRequest[];
  variants: ProductVariantRequest[];
}
```

`PUT` 방식이므로 상품 필드와 세 하위 배열을 모두 전송한다. 기존 하위 행은 응답에서 받은
`seq`를 포함하면 같은 행을 갱신하고, `seq`가 없으면 새 행을 추가한다. 기존 응답에는 있었지만
수정 요청 배열에서 빠진 행은 삭제된다. 다른 상품에 속한 하위 `seq`를 보내면 HTTP `400`,
오류 코드 `C001`을 반환한다. 특히 사용 중인 variant를 제거하면 DB 참조 제약으로 실패할 수
있으므로 판매 이력이 있는 variant는 삭제 대신 `status` 변경을 권장한다.

수정 요청 예시:

```json
{
  "wholesaleStoreSeq": 1,
  "categorySeq": 8,
  "name": "수정된 슬림핏 티셔츠",
  "description": "수정된 상세 설명",
  "status": "ACTIVE",
  "minOrderQuantity": 3,
  "images": [
    {"seq": 11, "imageUrl": "https://cdn.example.com/products/120/1-new.jpg", "imageType": "DETAIL", "sortOrder": 0},
    {"imageUrl": "https://cdn.example.com/products/120/2-new.jpg", "imageType": "DETAIL", "sortOrder": 1}
  ],
  "options": [
    {"seq": 21, "optionName": "색상", "optionValue": "블랙", "sortOrder": 0},
    {"optionName": "색상", "optionValue": "아이보리", "sortOrder": 1}
  ],
  "variants": [
    {"seq": 31, "sku": "SEED-017-BLK-M", "color": "블랙", "size": "M", "supplyPrice": 27000, "salePrice": 41000, "status": "ACTIVE"},
    {"sku": "SEED-017-IVR-M", "color": "아이보리", "size": "M", "supplyPrice": 27500, "salePrice": 42000, "status": "ACTIVE"}
  ]
}
```

위 예시에서 `seq: 11`, `21`, `31`은 기존 행을 수정하고 `seq`가 없는 행은 새로 추가한다.
기존 상세 응답에 있던 하위 행을 요청에서 제외하면 삭제된다. 수정 폼 초기값에는 상세 응답의
세 배열과 각 `seq`를 그대로 보관해야 한다.

- 성공 HTTP Status: `200`
- 응답: 수정된 `Product`
- 없는 상품: HTTP `404`, 오류 코드 `P001`

### 7.6 상품 조회 로그 등록

```http
POST /api/v1/products/{productSeq}/views
Authorization: Bearer {accessToken}
Content-Type: application/json
```

```ts
export interface ProductViewCreateRequest {
  userId?: number | null;
}

export interface ProductView {
  seq: number;
  userId: number | null;
  productSeq: number;
  viewedAt: string;
}
```

- 엔드포인트 인증은 필수지만 `userId` 필드는 nullable이다. 현재 서버는 토큰 사용자와 요청 `userId`의 일치 여부를 검증하거나 자동 설정하지 않는다.
- 성공 HTTP Status: `201`
- 없는 상품은 HTTP `404`, 오류 코드 `P001`이다.
- 등록된 로그 수는 상품 응답의 `viewCount`에 반영된다.

### 7.7 상품 API 오류 응답

현재 상품 모듈 오류 응답은 다음 구조다.

```ts
export interface ProductApiError {
  timestamp: string;
  code: string;
  message: string;
  errors: Array<{
    field: string;
    message: string;
  }>;
}
```

검증 실패 예시:

```json
{
  "timestamp": "2026-07-25T10:31:00",
  "code": "C001",
  "message": "Invalid input.",
  "errors": [
    {
      "field": "name",
      "message": "must not be blank"
    }
  ]
}
```

상품 등록·수정 화면 처리 기준:

- HTTP `400`: `errors`를 각 입력 필드에 연결한다.
- HTTP `401`: 토큰 재발급 후 한 번만 재시도한다.
- HTTP `403`: 접근 권한 안내를 표시한다.
- HTTP `404` + `P001`: 목록으로 이동하고 “상품이 존재하지 않습니다”를 안내한다.
- HTTP `500`: 입력값을 유지하고 공통 서버 오류를 표시한다.

현재 구현상 FK·CHECK·UNIQUE 같은 DB 제약 위반은 상품 전용 오류로 변환되지 않아 HTTP `500`,
코드 `S001`이 될 수 있다. 이 경우 입력 상태를 유지하고 재시도 또는 관리자 문의를 제공한다.

### 7.8 프론트 API 함수 예시

```ts
export interface ProductSearchParams {
  page?: number;
  size?: number;
  wholesaleStoreSeq?: number;
  categorySeq?: number;
  status?: string;
  name?: string;
}

export const productApi = {
  list: (params: ProductSearchParams) =>
    api.get<ProductPage>("/api/v1/products", { params }).then(({ data }) => data),

  detail: (productSeq: number) =>
    api.get<Product>(`/api/v1/products/${productSeq}`).then(({ data }) => data),

  create: (request: ProductCreateRequest) =>
    api.post<Product>("/api/v1/products", request).then(({ data }) => data),

  update: (productSeq: number, request: ProductUpdateRequest) =>
    api.put<Product>(`/api/v1/products/${productSeq}`, request).then(({ data }) => data),
};
```

권장 화면 상태:

```ts
export type ProductListState = "loading" | "success" | "empty" | "error";

export type ProductFormState =
  | "idle"
  | "submitting"
  | "validation-error"
  | "not-found"
  | "success"
  | "error";
```

- 등록·수정 요청 중에는 저장 버튼을 비활성화한다.
- `400`의 `errors[].field`는 `images[0].imageUrl` 같은 중첩 경로가 올 수 있으므로 폼 경로로 연결한다.
- 수정 완료 후에는 응답의 새 하위 `seq`와 정렬 결과를 폼 상태에 다시 반영한다.
- `404/P001`이면 상세·수정 화면을 닫고 상품 목록을 갱신한다.

## 8. 장바구니 API

### 8.1 데이터 타입

```ts
export interface CartItem {
  seq: number;
  wholesaleStoreSeq: number;
  productSeq: number;
  productName: string;
  imageUrl: string | null;
  variantSeq: number;
  sku: string;
  color: string | null;
  size: string | null;
  salePrice: number;
  quantity: number;
  lineAmount: number;
  createdAt: string;
}

export interface CartBuyer {
  userSeq: number;
  name: string;
  phone: string;
  businessProfileSeq: number | null;
  businessNumber: string | null;
  companyName: string | null;
  representativeName: string | null;
  retailStoreSeq: number | null;
  retailStoreName: string | null;
  salesChannel: string | null;
}

export interface CartWholesaleGroup {
  wholesaleStoreSeq: number;
  wholesaleStoreName: string;
  marketName: string | null;
  floorRoom: string | null;
  businessProfileSeq: number;
  businessNumber: string;
  companyName: string;
  representativeName: string;
  items: CartItem[];
  totalQuantity: number;
  subtotalAmount: number;
}

export interface Cart {
  userSeq: number;
  buyer: CartBuyer;
  wholesales: CartWholesaleGroup[];
  totalQuantity: number;
  totalAmount: number;
}

export interface CartItemAddRequest {
  productSeq: number;
  variantSeq: number;
  quantity: number;
}

export interface CartItemUpdateRequest {
  quantity: number;
}
```

`salePrice`, `lineAmount`, `totalAmount`은 JSON number로 반환되는 `numeric` 값이다. 금액
표시 시 프론트에서 통화 포맷을 적용하고 부동소수점 재계산은 피한다.

### 8.2 엔드포인트

| 기능 | Method | 경로 | 성공 Status | 응답 |
|---|---|---|---:|---|
| 내 장바구니 목록 | `GET` | `/api/v1/carts` | `200` | `Cart` |
| 상품 추가 | `POST` | `/api/v1/carts` | `201` | `Cart` |
| 수량 수정 | `PUT` | `/api/v1/carts/{cartSeq}` | `200` | `Cart` |
| 상품 삭제 | `DELETE` | `/api/v1/carts/{cartSeq}` | `204` | body 없음 |

추가 요청 예시:

```json
{
  "productSeq": 101,
  "variantSeq": 1001,
  "quantity": 2
}
```

수량 수정 요청 예시:

```json
{
  "quantity": 3
}
```

확정된 처리 기준:

- 모든 API는 `Authorization: Bearer {accessToken}`이 필요하다.
- 서버가 로그인 토큰의 사용자 PK를 `userSeq`로 사용한다. 프론트는 `userSeq`를 경로나 body에 보내지 않는다.
- 별도 장바구니 생성 API는 없다. 상품을 추가하면 `carts` 행이 생성된다.
- `CartItem.seq`가 수정·삭제 경로의 `cartSeq`다. 장바구니 전체를 나타내는 헤더 ID가 아니다.
- `quantity`는 `1` 이상이어야 한다.
- `variantSeq`는 요청한 `productSeq`에 속해야 한다.
- 같은 사용자가 동일 variant를 다시 추가하면 새 행을 만들지 않고 기존 수량에 합산한다.
- 수정·삭제 시 로그인 사용자의 행만 조회하므로 다른 사용자의 `cartSeq`에는 접근할 수 없다.
- `buyer`는 로그인 사용자를 기준으로 항상 반환한다. 연결된 소매 사업자 프로필 또는 소매 매장이
  없으면 관련 필드는 `null`이며, 소매 매장 소유권과 주문 가능 여부는 주문 생성 API에서 검증한다.
- `wholesales`는 상품의 도매 매장별 그룹이며 도매 사업자 정보와 그룹별 소계를 포함한다.
- 그룹 내부 목록은 최근 담은 항목 순이며 대표 이미지는 `sortOrder`, `seq`가 가장 빠른 이미지다.
- 추가·수정 응답도 갱신된 전체 `Cart`를 반환하므로 프론트는 응답으로 상태를 교체한다.
- 삭제 성공 시 `204`이므로 JSON body를 파싱하지 않는다.

```ts
export const cartApi = {
  list: () =>
    api.get<Cart>('/api/v1/carts').then(({ data }) => data),

  add: (request: CartItemAddRequest) =>
    api.post<Cart>('/api/v1/carts', request)
      .then(({ data }) => data),

  updateQuantity: (
    cartSeq: number,
    request: CartItemUpdateRequest,
  ) =>
    api.put<Cart>(`/api/v1/carts/${cartSeq}`, request).then(({ data }) => data),

  remove: (cartSeq: number) =>
    api.delete<void>(`/api/v1/carts/${cartSeq}`),
};
```

### 8.3 오류 및 화면 상태

| HTTP Status | 코드 | 상황 | 프론트 처리 |
|---:|---|---|---|
| `400` | `C001` | 수량이 1 미만이거나 필수값 누락 | 수량 입력 오류를 표시한다. |
| `404` | `CART002` | 로그인 사용자 소유의 장바구니 상품 행 없음 | 목록을 다시 조회한다. |
| `404` | `P001` | 상품 없음 | 판매 종료 안내 후 상품을 제거하거나 갱신한다. |
| `404` | `P003` | variant 없음 또는 상품과 불일치 | 옵션 선택을 다시 받는다. |
| `409` | `CART003` | 저장된 상품·variant 참조 불일치 | 목록 재조회 후 계속되면 관리자에게 문의한다. |
| `409` | `CART004` | 토큰의 사용자 정보가 실제 `users`에 없음 | 다시 로그인하고 계속되면 관리자에게 문의한다. |
| `409` | `CART005` | 도매 매장 또는 도매 사업자 관계 누락 | 해당 도매처 그룹 주문을 막고 관리자에게 문의한다. |

현재 미확정 정책:

- 판매 중지 상품·비활성 variant의 장바구니 추가 허용 여부
- 재고 및 상품별 최소 주문 수량을 장바구니 단계에서 검증할지 여부
- 주문 생성 시 로그인 사용자를 실제 주문자로 확정하는 방식
- 한 사용자 사업자 프로필에 소매 매장이 여러 개인 경우 `buyer`에 사용할 매장 선택 방식(현재는 `retail_stores.seq`가 가장 작은 매장)

프론트는 `userSeq`를 직접 입력받지 않고 응답의 `CartItem.seq`만 수정·삭제에 사용한다.

## 9. 주문 API

### 9.1 장바구니 주문 생성

```http
POST /api/v1/orders/from-cart
Authorization: Bearer {accessToken}
Content-Type: application/json
```

```ts
export interface CartOrderCreateRequest {
  cartSeqs: number[];
  retailStoreSeq: number;
  recipientName: string;
  recipientPhone: string;
  shippingAddressSeq?: number | null;
}

export interface OrderItem {
  seq: number;
  wholesaleStoreSeq: number;
  wholesaleStoreName: string | null;
  productSeq: number;
  variantSeq: number;
  productName: string;
  option: { sku: string; color: string | null; size: string | null } | null;
  unitPrice: number;
  quantity: number;
  lineAmount: number;
  status: string;
}

export interface Order {
  seq: number;
  orderNo: string;
  retailStoreSeq: number;
  retailStoreName: string | null;
  buyerUserSeq: number | null;
  buyerUserId: string | null;
  buyerName: string | null;
  status: string;
  subtotalAmount: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  recipientName: string;
  recipientPhone: string;
  shippingAddressSeq: number | null;
  createdAt: string;
  items: OrderItem[];
  shipments: SellerOrderShipment[];
}

export interface SellerOrderShipment {
  shipmentSeq: number;
  wholesaleStoreSeq: number | null;
  wholesaleStoreName: string | null;
  deliveryCompanyCode: string | null;
  deliveryCompanyName: string | null;
  trackingNumber: string | null;
  status: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  items: Array<{
    shipmentItemSeq: number;
    orderItemSeq: number;
    quantity: number;
  }>;
}
```

```json
{
  "cartSeqs": [11, 12],
  "retailStoreSeq": 3,
  "recipientName": "홍길동",
  "recipientPhone": "01012345678",
  "shippingAddressSeq": 7
}
```

- 성공 HTTP Status는 `201 Created`이며 공통 envelope 없이 생성된 `Order[]`를 직접 반환한다.
- 선택 상품은 도매 매장별로 그룹화되며, 도매 매장마다 별도의 주문 헤더와 `orderNo`가 생성된다.
  같은 도매 매장의 여러 상품은 하나의 주문에 포함되고, 여러 도매 매장을 함께 주문하면 응답 배열에
  도매 매장 수만큼 주문이 반환된다.
- `cartSeqs`에는 결제 대상으로 선택한 장바구니 상품 행의 `seq`를 보낸다.
- 다른 사용자의 장바구니 또는 소매 매장은 주문할 수 없다.
- 상품과 variant가 모두 `ACTIVE`이고 수량이 상품의 최소 주문 수량 이상이어야 한다.
- 단가는 서버가 `product_variants.sale_price`에서 확정하며 요청에서 금액을 받지 않는다.
- 현재 배송비와 할인 금액은 정책 미확정으로 각각 `0`이며 `totalAmount = subtotalAmount`다.
- 주문 시 재고를 예약하고 초기 `PRODUCT_ORDERED` 상태 이력을 저장한 뒤 선택된 장바구니 행을 삭제한다.
- `shippingAddressSeq`는 nullable이다. 현재 주소 소유권 검증 정책은 미확정이다.

### 9.2 사용자 주문 조회

| 기능 | Method | 경로 | 성공 Status | 응답 |
|---|---|---|---:|---|
| 내 주문 목록 | `GET` | `/api/v1/orders` | `200` | `PageResponse<Order>` |
| 내 주문 상세 | `GET` | `/api/v1/orders/{orderSeq}` | `200` | `Order` |

로그인 사용자의 사업자 프로필에 연결된 모든 소매 매장의 주문을 조회하며 목록은 최신 주문순이다.
선택 query는 `page`, `size`, `status`다.
목록과 상세 응답 모두 주문별 `shipments`를 포함한다. 도매업체가 아직 출고 정보를 생성하지
않았다면 빈 배열이다. 분할 출고가 진행되면 같은 주문에 여러 출고가 반환되며, 각 출고의
`items[].orderItemSeq`로 주문 품목과 연결한다.

셀러 주문관리 화면은 `shipments[].status`로 출고 진행 상태를 표시하고, 택배사명과 송장번호는
값이 있을 때만 노출한다. `SHIPMENT_PREPARING`은 출고 준비중, `SHIPPED`는 출고 완료다.
`deliveryCompanyCode`, `deliveryCompanyName`, `trackingNumber`는 출고 준비 단계에서 `null`일 수 있다.

### 9.3 관리자 주문 목록

```http
GET /api/v1/admin/orders
Authorization: Bearer {accessToken}
```

- 성공 HTTP Status `200`, 응답은 `PageResponse<Order>`다.
- 전체 주문을 `seq` 내림차순으로 반환하고 주문자·소매 매장·도매 매장 정보를 포함한다.
- 관리자 주문 API는 DB 역할 `ADMIN` 사용자만 접근할 수 있다.

```ts
export const orderApi = {
  createFromCart: (body: CartOrderCreateRequest) =>
    api.post<Order[]>('/api/v1/orders/from-cart', body),
  myOrders: (params: { page?: number; size?: number; status?: string }) =>
    api.get<PageResponse<Order>>('/api/v1/orders', { params }),
  myOrder: (seq: number) => api.get<Order>(`/api/v1/orders/${seq}`),
  adminOrders: (params: { page?: number; size?: number; status?: string }) =>
    api.get<PageResponse<Order>>('/api/v1/admin/orders', { params }),
};
```

| HTTP Status | 코드 | 상황 |
|---:|---|---|
| `400` | `C001` | 필수값 누락, 빈 장바구니 선택, 수령인 길이 초과 |
| `404` | `O001` | 사용자 소유 주문 없음 |
| `404` | `RS001` | 요청한 소매 매장 없음 |
| `409` | `O002` | 장바구니 행 없음 또는 다른 사용자 소유 |
| `409` | `O003` | 상품·variant 불일치, 판매 중지, 최소 주문 수량 미달 |
| `409` | `O004` | 소매 매장이 로그인 사용자 소유가 아님 |
| `409` | `P002` | 재고 행 없음 또는 주문 가능 재고 부족 |

주문 API의 예상 가능한 업무 오류는 다음 공통 오류 객체의 `message`에 한글 상세 사유가
포함된다. 프론트는 주문 실패 알림 또는 오류 레이어에 `message`를 표시한다.

```ts
export interface OrderApiError {
  timestamp: string;
  code: string;
  message: string;
  errors: Array<{ field: string; message: string }>;
}
```

```json
{
  "timestamp": "2026-08-11T21:10:00",
  "code": "P002",
  "message": "상품 옵션 1001의 주문 가능 재고가 부족합니다. 주문 가능 수량: 2, 요청 수량: 5",
  "errors": []
}
```

상세 메시지에는 상황에 따라 `cartSeq`, `productSeq`, `variantSeq`, 상품명, SKU, 최소 주문
수량, 주문 가능 수량이 포함될 수 있다. 이 값은 원인 확인용이며 화면 분기에는 문자열을
파싱하지 말고 안정적인 `code`를 사용한다.

### 9.4 도매 주문 처리 및 출고

모든 API는 Bearer 인증이 필요하며, 로그인 사용자의 사업자 프로필에 연결된 도매 매장 상품만
조회하거나 변경할 수 있다. 주문 상품 상태는 다음 순서만 허용한다.

```text
PRODUCT_ORDERED(상품주문)
  -> PRODUCT_PREPARING(상품 준비중)
  -> PRODUCT_READY(상품 준비 완료)
  -> SHIPMENT_PREPARING(출고 준비중)
  -> SHIPPED(출고 완료)
```

`PRODUCT_READY`까지는 주문 상품 상태이고, 이후 두 값은 주문 헤더 및 출고 상태다. 주문 상품은
개별적으로 `PRODUCT_READY`가 되는 순간 출고 대상이 되어 단건 출고할 수 있다. 같은 주문·도매
매장의 `SHIPMENT_PREPARING` 출고가 있으면 준비 완료 상품이 그 출고에 누적된다. 기존 출고가
`SHIPPED`인 뒤 다른 상품이 준비 완료되면 같은 `orderSeq`로 새 출고 정보가 생성된다. 수동 생성
API는 준비 완료이면서 아직 출고에 배정되지 않은 상품만 준비중 출고에 추가하며, 추가 대상이
없으면 중복 출고를 만들지 않고 기존 출고를 반환한다.

신규 주문은 `PRODUCT_ORDERED`로 생성한다. 기존 데이터의 `CREATED`는 서버에서
`PRODUCT_ORDERED`와 같은 최초 상태로 취급하므로 `PRODUCT_PREPARING`으로 변경할 수 있다.
프론트도 `CREATED`를 `PRODUCT_ORDERED`로 정규화해 `상품주문`으로 표시한다.

| 기능 | Method | 경로 | 성공 Status |
|---|---|---|---:|
| 내 도매 매장 선택 목록 | `GET` | `/api/v1/wholesale/stores` | `200` |
| 도매 주문 목록 | `GET` | `/api/v1/wholesale/orders` | `200 PageResponse<WholesaleOrder>` |
| 주문 상품 상태 변경 | `PATCH` | `/api/v1/wholesale/orders/{orderSeq}/items/{orderItemSeq}/status` | `200` |
| 출고 정보 생성 | `POST` | `/api/v1/wholesale/orders/{orderSeq}/shipments` | `201` |
| 출고 목록 | `GET` | `/api/v1/wholesale/shipments` | `200 PageResponse<Shipment>` |
| 활성 택배사 선택 목록 | `GET` | `/api/v1/wholesale/delivery-companies` | `200` |
| 출고 상태 변경 | `PATCH` | `/api/v1/wholesale/shipments/{shipmentSeq}/status` | `200` |
| 출고 수량 변경 | `PUT` | `/api/v1/wholesale/shipments/{shipmentSeq}/items/{shipmentItemSeq}/quantity` | `200` |

목록 API는 공통 `page`, `size`와 선택 query `wholesaleStoreSeq`, `status`를 받는다. 주문 목록의 `status`는 주문
상품 상태를, 출고 목록의 `status`는 출고 상태를 필터링한다.

도매 주문 목록과 상태 변경은 로그인 사용자가 소유한 도매 매장 범위로 제한된다. 하나의 주문에
여러 도매업체 상품이 포함돼도 응답 `items`에는 로그인 도매업체 소유 상품만 포함되며,
다른 업체의 `wholesaleStoreSeq`를 query로 보내거나 주문 상품 상태를 변경할 수 없다.

주문관리의 도매 매장 select는 관리자 전체 매장 API인 `/api/v1/admin/wholesale-stores`를 사용하지
않고 `GET /api/v1/wholesale/stores`를 사용한다. 이 API는 로그인 사용자 소유 매장만 반환한다.

```ts
export interface WholesaleOwnedStore {
  seq: number;
  storeName: string;
  status: string;
}
```

```ts
export type OrderItemFulfillmentStatus =
  | 'PRODUCT_ORDERED'
  | 'PRODUCT_PREPARING'
  | 'PRODUCT_READY';

export type ShipmentStatus = 'SHIPMENT_PREPARING' | 'SHIPPED';

export interface DeliveryCompanyOption {
  code: string;
  name: string;
}

export interface WholesaleOrderItem {
  orderItemSeq: number;
  wholesaleStoreSeq: number;
  wholesaleStoreName: string | null;
  productSeq: number;
  variantSeq: number;
  productName: string;
  sku: string | null;
  color: string | null;
  size: string | null;
  unitPrice: number;
  quantity: number;
  lineAmount: number;
  status: OrderItemFulfillmentStatus;
}

export interface WholesaleOrder {
  orderSeq: number;
  orderNo: string;
  status: string;
  retailStoreSeq: number;
  retailStoreName: string | null;
  buyerCompanyName: string | null;
  recipientName: string;
  recipientPhone: string;
  createdAt: string;
  items: WholesaleOrderItem[];
}

export interface Shipment {
  shipmentSeq: number;
  orderSeq: number;
  orderNo: string;
  wholesaleStoreSeq: number;
  wholesaleStoreName: string | null;
  deliveryCompanyCode: string | null;
  trackingNumber: string | null;
  status: ShipmentStatus;
  shippedAt: string | null;
  deliveredAt: string | null;
  items: Array<{
    shipmentItemSeq: number;
    orderItemSeq: number;
    productSeq: number;
    variantSeq: number;
    productName: string;
    orderedQuantity: number;
    shipmentQuantity: number;
  }>;
}
```

주문 품목 옵션은 가변 `options` 객체가 아니라 고정된 `sku`, `color`, `size` 필드로 반환한다.
주문 생성 당시 옵션 snapshot에 값이 없으면 각 필드는 `null`이다. 레거시 DB 상태 `CREATED`는
주문과 주문 품목 응답에서 모두 `PRODUCT_ORDERED`로 정규화되므로 프론트가 별도로 변환하지 않는다.
`retailStoreName`은 주문의 소매 매장명, `buyerCompanyName`은 해당 매장 사업자 상호이며 참조
데이터가 없으면 `null`이다.

주문 품목 상태 변경 API의 성공 응답은 로그인 사용자가 소유한 매장 품목을 모두 포함한
`WholesaleOrder` 전체 객체다. 프론트는 성공 응답으로 해당 주문을 통째로 교체할 수 있다.

요청 예시는 다음과 같다.

```json
{ "status": "PRODUCT_PREPARING" }
```

```json
{
  "wholesaleStoreSeq": 10,
  "deliveryCompanyCode": "CJ",
  "trackingNumber": "1234567890"
}
```

자동 생성 시 택배사와 송장번호는 `null`일 수 있다. 출고 완료 변경 시에는 둘 다 필수다.
화면 진입 시 `GET /api/v1/wholesale/delivery-companies`를 조회해 `name`을 select 표시값으로,
`code`를 option value로 사용한다. 택배사 코드를 사용자가 직접 입력받지 않는다. 목록에는 활성
택배사만 포함되며 택배사명·코드 오름차순이다.

```ts
const deliveryCompanies = await api.get<DeliveryCompanyOption[]>(
  '/api/v1/wholesale/delivery-companies',
);
```

```json
{
  "status": "SHIPPED",
  "deliveryCompanyCode": "CJ",
  "trackingNumber": "1234567890"
}
```

```json
{ "quantity": 3 }
```

출고 수량은 1 이상이고 원 주문 수량 이하여야 하며 `SHIPMENT_PREPARING` 상태에서만 변경할 수 있다.
현재 단건·분할 출고에는 기존 필드로 충분하다. 출고 한 건에는 같은 주문과 같은 도매 매장의 상품만
포함되며, 프론트는 동일한 `orderSeq`를 가진 복수의 `shipmentSeq`가 존재할 수 있음을 전제로 표시한다.

| HTTP Status | 코드 | 상황 |
|---:|---|---|
| `404` | `WS001` | 로그인 사용자의 도매 매장이 아님 |
| `404` | `O001` | 주문 또는 주문 상품 없음 |
| `409` | `O005` | 허용되지 않은 주문 상태 전이 또는 준비 미완료 |
| `404` | `SH001` | 출고 또는 출고 상품 없음/소유권 없음 |
| `409` | `SH002` | 허용되지 않은 출고 상태 전이 |
| `409` | `SH003` | 출고 수량이 주문 수량을 초과함 |
| `404` | `SH004` | 택배사 코드가 없거나 비활성 상태 |

주문 헤더의 집계 상태가 바뀔 때마다 `order_status_logs`에 변경 전·후 상태와 변경 사용자가
기록된다. 한 주문에 여러 도매 매장이 포함된 경우 각 도매 매장은 자기 상품과 출고만 응답에서 본다.

## 10. 토큰 저장 및 보안

- 비밀번호, access token을 콘솔이나 분석 이벤트에 기록하지 않는다.
- 현재 access token은 응답 body로 전달된다.
- 저장 방식은 프론트 보안 정책에 따라 결정하되 XSS 위험이 있는 영구 저장소 사용을 최소화한다.
- 로그아웃 시 토큰, 사용자 정보 및 인증 관련 캐시를 모두 제거한다.
- API 요청 로그에 `Authorization` 헤더가 출력되지 않도록 한다.

## 11. 권장 Pinia 상태

```ts
interface AuthState {
  accessToken: string | null;
  accessTokenExpiresAt: number | null;
  user: Omit<User, "passwd"> | null;
  loginStatus: "idle" | "loading" | "authenticated" | "error";
  refreshPromise: Promise<string> | null;
}
```

권장 액션:

- `signUp(payload)`
- `login(payload)`
- `fetchCurrentUser()`
- `refreshAccessToken()`
- `logout()`
- `clear()`

## 12. 프론트 완료 기준

### 회원가입

- 필수값과 최대 길이를 API 호출 전에 검증한다.
- 요청 중 중복 클릭을 방지한다.
- `DUPLICATE_USER`를 사용자 ID 필드 오류로 연결한다.
- 성공 후 정책에 맞는 로그인 또는 가입 완료 화면으로 이동한다.

### 로그인 및 인증

- 로그인 성공 시 만료 epoch 값을 함께 저장한다.
- 인증 API에 Bearer 헤더를 자동으로 추가한다.
- `401` 발생 시 토큰 재발급을 한 번만 시도한다.
- 재발급 실패 시 인증 상태를 초기화하고 로그인 화면으로 이동한다.
- 로그아웃은 API 실패 여부와 관계없이 로컬 인증 상태를 제거한다.

### 상품

- 목록의 로딩·빈 결과·오류 상태를 분리한다.
- 검색 조건 변경 시 페이지를 `0`으로 초기화한다.
- 등록·수정 요청 중 저장 버튼을 비활성화한다.
- 서버 검증 오류의 `errors[].field`를 입력 컴포넌트에 연결한다.
- 수정 화면 진입 시 상품 상세를 다시 조회한다.

### 장바구니

- 목록의 loading, empty, error 상태를 구분한다.
- 추가·수정 중 해당 버튼을 비활성화해 중복 요청을 막는다.
- 수량은 요청 전에 `1` 이상인지 검증한다.
- 삭제 `204` 응답은 body를 파싱하지 않고 로컬 목록을 갱신한다.
- `CART002`, `CART003` 발생 시 장바구니 목록을 다시 조회한다.

## 13. 서비스 관리자 사용자·사업자·매장 API

모든 요청은 Bearer access token이 필요하며 `/api/v1/admin/**`는 `ROLE_ADMIN` 또는
`ROLE_SYSTEMADMIN`만 접근할 수 있다.

### 13.1 사용자 API

사용자 목록과 저장 응답은 공통 envelope 없이 아래 객체 또는 객체 배열을 직접 반환하며,
비밀번호 필드는 포함하지 않는다.

```ts
export interface AdminUser {
  seq: number;
  userId: string;
  phone: string;
  name: string;
  status: string;
  businessType: 'WHOLESALE' | 'RETAIL';
  role: 'RETAILER' | 'WHOLESALER' | 'ADMIN';
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserCreateRequest {
  userId: string;
  passwd: string;
  phone: string;
  name: string;
  status: string;
  businessType: 'WHOLESALE' | 'RETAIL';
  role: 'RETAILER' | 'WHOLESALER' | 'ADMIN';
}

export interface AdminUserUpdateRequest {
  userId: string;
  passwd?: string;
  phone: string;
  name: string;
  status: string;
  businessType: 'WHOLESALE' | 'RETAIL';
  role: 'RETAILER' | 'WHOLESALER' | 'ADMIN';
}
```

| 기능 | Method | 경로 | 성공 Status |
|---|---|---|---:|
| 사용자 목록 | `GET` | `/api/v1/admin/users` | `200` |
| 사용자 등록 | `POST` | `/api/v1/admin/users` | `201` |
| 사용자 수정 | `PUT` | `/api/v1/admin/users/{userSeq}` | `200` |

- 목록은 `seq` 내림차순으로 반환한다.
- 등록 요청은 모든 필드가 필수다.
- 수정은 전체 필드를 보내는 PUT 계약이지만 `passwd`만 생략하거나 빈 문자열로 보낼 수 있으며,
  이 경우 기존 비밀번호를 유지한다.
- `userId`, `phone`, `name`, `status`는 앞뒤 공백을 제거해 저장한다.
- 필드 최대 길이는 각각 `userId` 255, `passwd` 500, `phone` 30, `name` 100,
  `status` 30이다.

```ts
export const adminUserApi = {
  users: (params: { page?: number; size?: number; keyword?: string; status?: string; businessType?: string }) =>
    api.get<PageResponse<AdminUser>>('/api/v1/admin/users', { params }),
  create: (body: AdminUserCreateRequest) =>
    api.post<AdminUser>('/api/v1/admin/users', body),
  update: (seq: number, body: AdminUserUpdateRequest) =>
    api.put<AdminUser>(`/api/v1/admin/users/${seq}`, body),
};
```

오류는 `400/C001`(필수값·길이 검증), `404/AU001`(수정 대상 없음),
`409/AU002`(사용자 ID 중복)를 처리한다. `status` 허용 목록과 상태 전이 규칙은 미확정이다.

### 13.2 사업자·매장 API

```ts
export interface BusinessProfile {
  seq: number; userSeq: number; userId: string | null; userName: string;
  businessNumber: string; companyName: string; representativeName: string;
  approvalStatus: string; approvedAt: string | null;
}
export type BusinessProfileRequest = Omit<BusinessProfile, 'seq' | 'userId' | 'userName'>;

export interface WholesaleStore {
  seq: number; businessProfileSeq: number; companyName: string; businessNumber: string;
  storeName: string; marketName: string | null; floorRoom: string | null; status: string;
}
export type WholesaleStoreRequest = Pick<WholesaleStore,
  'businessProfileSeq' | 'storeName' | 'marketName' | 'floorRoom' | 'status'>;

export interface RetailStore {
  seq: number; businessProfileSeq: number; companyName: string; businessNumber: string;
  storeName: string; salesChannel: string | null; status: string;
}
export type RetailStoreRequest = Pick<RetailStore,
  'businessProfileSeq' | 'storeName' | 'salesChannel' | 'status'>;
```

| 기능 | Method | 경로 | 성공 Status |
|---|---|---|---:|
| 사업자 프로필 목록 | `GET` | `/api/v1/admin/business-profiles` | `200` |
| 사업자 프로필 등록 | `POST` | `/api/v1/admin/business-profiles` | `201` |
| 사업자 프로필 수정 | `PUT` | `/api/v1/admin/business-profiles/{businessProfileSeq}` | `200` |
| 도매상 매장 목록 | `GET` | `/api/v1/admin/wholesale-stores?businessProfileSeq={seq}` | `200` |
| 도매상 매장 등록 | `POST` | `/api/v1/admin/wholesale-stores` | `201` |
| 도매상 매장 수정 | `PUT` | `/api/v1/admin/wholesale-stores/{wholesaleStoreSeq}` | `200` |
| 소매상 매장 목록 | `GET` | `/api/v1/admin/retail-stores?businessProfileSeq={seq}` | `200` |
| 소매상 매장 등록 | `POST` | `/api/v1/admin/retail-stores` | `201` |
| 소매상 매장 수정 | `PUT` | `/api/v1/admin/retail-stores/{retailStoreSeq}` | `200` |

매장 목록의 `businessProfileSeq`는 선택 필터다. 생략하면 전체 목록을 `seq` 내림차순으로
반환한다. 등록·수정은 전체 필드를 보내는 PUT 계약이며 빈 문자열 대신 nullable 필드는
`null`을 사용한다. 상태 허용 목록은 정의서에서 확정되지 않아 프론트에서 임의로 고정하지 않는다.

```ts
export const adminBusinessApi = {
  businessProfiles: (params: { page?: number; size?: number; userSeq?: number; keyword?: string; approvalStatus?: string }) =>
    api.get<PageResponse<BusinessProfile>>('/api/v1/admin/business-profiles', { params }),
  createBusinessProfile: (body: BusinessProfileRequest) =>
    api.post<BusinessProfile>('/api/v1/admin/business-profiles', body),
  updateBusinessProfile: (seq: number, body: BusinessProfileRequest) =>
    api.put<BusinessProfile>(`/api/v1/admin/business-profiles/${seq}`, body),
  wholesaleStores: (businessProfileSeq?: number) =>
    api.get<PageResponse<WholesaleStore>>('/api/v1/admin/wholesale-stores', { params: { businessProfileSeq } }),
  createWholesaleStore: (body: WholesaleStoreRequest) =>
    api.post<WholesaleStore>('/api/v1/admin/wholesale-stores', body),
  updateWholesaleStore: (seq: number, body: WholesaleStoreRequest) =>
    api.put<WholesaleStore>(`/api/v1/admin/wholesale-stores/${seq}`, body),
  retailStores: (businessProfileSeq?: number) =>
    api.get<PageResponse<RetailStore>>('/api/v1/admin/retail-stores', { params: { businessProfileSeq } }),
  createRetailStore: (body: RetailStoreRequest) =>
    api.post<RetailStore>('/api/v1/admin/retail-stores', body),
  updateRetailStore: (seq: number, body: RetailStoreRequest) =>
    api.put<RetailStore>(`/api/v1/admin/retail-stores/${seq}`, body),
};
```

오류 코드는 대표 사용자 없음 `BP001`, 사업자 프로필 없음 `BP002`, 사업자 충돌 `BP003`,
도매상 없음/충돌 `WS001`/`WS002`, 소매상 없음/충돌 `RS001`/`RS002`다. 입력 길이·필수값
오류는 `400/C001`, 인증 실패는 `401/C002`로 처리한다.

### 13.3 상품 재고 API

모든 요청은 Bearer access token이 필요하며 `/api/v1/wholesale/**` 접근 권한인
`ROLE_WHOLESALE`, `ROLE_ADMIN`, `ROLE_SYSTEMADMIN` 중 하나가 필요하다.

```ts
export interface WholesaleInventory {
  seq: number;
  variantSeq: number;
  sku: string | null;
  color: string | null;
  size: string | null;
  variantStatus: string | null;
  productSeq: number | null;
  productName: string | null;
  productStatus: string | null;
  wholesaleStoreSeq: number | null;
  wholesaleStoreName: string | null;
  availableQuantity: number;
  reservedQuantity: number;
  totalQuantity: number;
  updatedAt: string;
}

export interface WholesaleInventoryRequest {
  variantSeq: number;
  availableQuantity: number;
  reservedQuantity: number;
}

export interface WholesaleInventoryBulkItemRequest extends WholesaleInventoryRequest {
  seq?: number;
}

export interface WholesaleInventoryBulkRequest {
  items: WholesaleInventoryBulkItemRequest[];
}
```

| 기능 | Method | 경로 | 성공 Status |
|---|---|---|---:|
| 재고 목록 | `GET` | `/api/v1/wholesale/inventory` | `200` |
| 재고 등록 | `POST` | `/api/v1/wholesale/inventory` | `201` |
| 재고 수정 | `PUT` | `/api/v1/wholesale/inventory/{inventorySeq}` | `200` |
| 재고 다건 등록·수정 | `POST` | `/api/v1/wholesale/inventory/bulk` | `200` |

목록은 `inventory.seq` 내림차순이며 상품, SKU 옵션, 도매 매장 정보를 함께 반환한다.
로그인 사용자가 소유한 도매 매장의 상품 재고만 반환하며 다른 도매 매장의 variant로 등록·수정할 수 없다.
`availableQuantity`는 현재 주문 가능한 수량이고 `reservedQuantity`는 주문 접수 후 출고 전 예약
수량이다. 두 값은 모두 0 이상이어야 하며 `totalQuantity`는 두 수량의 합계인 응답 전용 필드다.

등록·수정의 `variantSeq`는 실제 `product_variants.seq`여야 한다. 주문 처리에서 variant별 재고
한 행을 전제로 하므로 이미 다른 재고 행에 사용된 `variantSeq`는 등록하거나 변경할 수 없다.

다건 API에서는 항목의 `seq`가 없으면 신규 등록하고, 있으면 해당 `inventory.seq`를 수정한다.
요청 내 `seq`와 `variantSeq`는 각각 중복될 수 없으며 모든 항목을 한 트랜잭션으로 저장한다.
한 항목이라도 검증이나 저장에 실패하면 일부만 반영하지 않고 전체 요청을 롤백한다. 기존 단건
등록·수정 API도 계속 사용할 수 있다.

```json
{
  "variantSeq": 1001,
  "availableQuantity": 80,
  "reservedQuantity": 20
}
```

다건 등록·수정 요청 예시:

```json
{
  "items": [
    {
      "variantSeq": 1001,
      "availableQuantity": 80,
      "reservedQuantity": 20
    },
    {
      "seq": 15,
      "variantSeq": 1002,
      "availableQuantity": 45,
      "reservedQuantity": 5
    }
  ]
}
```

```ts
export const wholesaleInventoryApi = {
  list: (params: { page?: number; size?: number }) =>
    api.get<PageResponse<WholesaleInventory>>('/api/v1/wholesale/inventory', { params }),
  create: (body: WholesaleInventoryRequest) =>
    api.post<WholesaleInventory>('/api/v1/wholesale/inventory', body),
  update: (seq: number, body: WholesaleInventoryRequest) =>
    api.put<WholesaleInventory>(`/api/v1/wholesale/inventory/${seq}`, body),
  bulkUpsert: (body: WholesaleInventoryBulkRequest) =>
    api.post<WholesaleInventory[]>('/api/v1/wholesale/inventory/bulk', body),
};
```

| HTTP Status | 코드 | 상황 |
|---:|---|---|
| `400` | `C001` | 필수값 누락 또는 음수 수량 |
| `404` | `P003` | 존재하지 않는 variant |
| `404` | `INV001` | 수정 대상 재고 없음 |
| `409` | `INV002` | 동일 variant 재고 중복 |
| `409` | `INV002` | 다건 요청 내부의 `seq` 또는 `variantSeq` 중복 |

### 13.4 택배사 관리 API

관리자 메뉴에는 `택배사 관리` 항목을 두고 다음 필드를 목록 및 등록·수정 폼에 표시한다.

```ts
export interface AdminDeliveryCompany {
  code: string;
  name: string;
  trackingUrlTemplate: string | null;
  active: boolean;
}

export interface AdminDeliveryCompanyCreateRequest {
  code: string;
  name: string;
  trackingUrlTemplate?: string | null;
  active: boolean;
}

export interface AdminDeliveryCompanyUpdateRequest {
  name: string;
  trackingUrlTemplate?: string | null;
  active: boolean;
}
```

| 기능 | Method | 경로 | 성공 Status |
|---|---|---|---:|
| 택배사 목록 | `GET` | `/api/v1/admin/delivery-companies` | `200` |
| 택배사 등록 | `POST` | `/api/v1/admin/delivery-companies` | `201` |
| 택배사 수정 | `PUT` | `/api/v1/admin/delivery-companies/{code}` | `200` |

목록은 `code` 오름차순으로 반환한다. `code`는 `delivery_companies`의 식별자이며 최대 30자,
`name`은 최대 100자다. 등록 후 코드는 변경할 수 없으므로 수정 화면에서는 읽기 전용으로 표시한다.
`trackingUrlTemplate`은 선택값이며 공백 문자열은 `null`로 저장한다. `active=false`인 택배사는
관리자 목록에는 계속 표시되지만 출고 완료 시 선택할 수 없다.

등록 요청 예시:

```json
{
  "code": "CJ",
  "name": "CJ대한통운",
  "trackingUrlTemplate": "https://trace.example.com/{trackingNumber}",
  "active": true
}
```

수정 요청 예시:

```json
{
  "name": "CJ대한통운",
  "trackingUrlTemplate": "https://trace.example.com/{trackingNumber}",
  "active": false
}
```

```ts
export const adminDeliveryCompanyApi = {
  list: (params: { page?: number; size?: number; keyword?: string; active?: boolean }) =>
    api.get<PageResponse<AdminDeliveryCompany>>('/api/v1/admin/delivery-companies', { params }),
  create: (body: AdminDeliveryCompanyCreateRequest) =>
    api.post<AdminDeliveryCompany>('/api/v1/admin/delivery-companies', body),
  update: (code: string, body: AdminDeliveryCompanyUpdateRequest) =>
    api.put<AdminDeliveryCompany>(
      `/api/v1/admin/delivery-companies/${encodeURIComponent(code)}`,
      body,
    ),
};
```

| HTTP Status | 코드 | 상황 |
|---:|---|---|
| `400` | `C001` | 코드·이름·활성 여부 누락 또는 길이 초과 |
| `404` | `DC001` | 수정 대상 택배사 없음 |
| `409` | `DC002` | 동일한 택배사 코드가 이미 존재함 |

### 13.5 도매상품 입고 관리 API

모든 요청은 Bearer access token이 필요하며 `/api/v1/wholesale/**` 접근 권한인
`ROLE_WHOLESALE`, `ROLE_ADMIN`, `ROLE_SYSTEMADMIN` 중 하나가 필요하다.

```ts
export type StockReceiptStatus = 'REGISTERED' | 'EXPECTED' | 'COMPLETED';

export interface WholesaleStockReceipt {
  seq: number;
  variantSeq: number;
  sku: string | null;
  color: string | null;
  size: string | null;
  productSeq: number | null;
  productName: string | null;
  wholesaleStoreSeq: number | null;
  wholesaleStoreName: string | null;
  quantity: number;
  status: StockReceiptStatus;
  memo: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WholesaleStockReceiptCreateRequest {
  variantSeq: number;
  quantity: number;
  memo?: string | null;
}

export interface WholesaleStockReceiptUpdateRequest extends WholesaleStockReceiptCreateRequest {
  status: StockReceiptStatus;
}
```

| 기능 | Method | 경로 | 성공 Status |
|---|---|---|---:|
| 입고 목록 | `GET` | `/api/v1/wholesale/stock-receipts` | `200` |
| 입고 등록 | `POST` | `/api/v1/wholesale/stock-receipts` | `201` |
| 입고 수정·상태 변경 | `PUT` | `/api/v1/wholesale/stock-receipts/{receiptSeq}` | `200` |

입고 목록은 `seq` 내림차순이며 상품, 옵션, 도매 매장 표시 정보를 함께 반환한다. 로그인 사용자가
소유한 도매 매장의 상품 입고만 반환하며 다른 도매 매장의 variant 또는 입고 건은 조회·등록·수정할
수 없다. 등록 요청에는 상태를 보내지 않으며 서버가 항상 `REGISTERED(등록)`로 생성한다. 상태는
다음 순서만 허용한다.

```text
REGISTERED(등록) -> EXPECTED(입고예정) -> COMPLETED(입고완료)
```

등록·입고예정 상태에서는 상품 옵션, 입고 수량, 메모를 수정할 수 있다. `COMPLETED`로 전환하면
해당 `variantSeq`의 주문 가능 재고 `availableQuantity`가 입고 수량만큼 증가한다. 완료 처리와
재고 증가는 하나의 트랜잭션이며 같은 입고 건은 한 번만 반영된다. 완료 후에는 입고 정보와 상태를
수정할 수 없다. 기존 재고 행이 없으면 `availableQuantity=입고 수량`, `reservedQuantity=0`으로
새 재고 행을 생성한다.

등록 요청 예시:

```json
{
  "variantSeq": 1001,
  "quantity": 50,
  "memo": "8월 2차 입고"
}
```

입고예정 변경 예시:

```json
{
  "variantSeq": 1001,
  "quantity": 48,
  "status": "EXPECTED",
  "memo": "8월 20일 입고 예정"
}
```

입고완료 변경 예시:

```json
{
  "variantSeq": 1001,
  "quantity": 48,
  "status": "COMPLETED",
  "memo": "검수 완료"
}
```

```ts
export const wholesaleStockReceiptApi = {
  list: (params: { page?: number; size?: number; status?: StockReceiptStatus }) =>
    api.get<PageResponse<WholesaleStockReceipt>>('/api/v1/wholesale/stock-receipts', { params }),
  create: (body: WholesaleStockReceiptCreateRequest) =>
    api.post<WholesaleStockReceipt>('/api/v1/wholesale/stock-receipts', body),
  update: (seq: number, body: WholesaleStockReceiptUpdateRequest) =>
    api.put<WholesaleStockReceipt>(`/api/v1/wholesale/stock-receipts/${seq}`, body),
};
```

| HTTP Status | 코드 | 상황 |
|---:|---|---|
| `400` | `C001` | 필수값 누락 또는 입고 수량이 1 미만 |
| `404` | `P003` | 존재하지 않는 상품 옵션 |
| `404` | `SR001` | 수정 대상 입고 정보 없음 |
| `409` | `SR002` | 잘못된 상태 전이 또는 완료된 입고 수정 |

## 14. 셀러·도매 관리자 추가 메뉴

레거시 `/api/v1/menus`는 개발 DB에 메뉴 마스터 테이블이 없어 사용하지 않는다. 프론트는 로그인
응답의 `adminScopes`로 메뉴를 구성한다.

셀러 관리자 권장 순서: 대시보드, 상품 탐색, 장바구니, 주문 관리, 배송지 관리, 결제·환불,
찜 상품, 문의, 알림, 사업자·매장 관리. 현재 상품·장바구니·주문·문의·알림 API가 구현되어 있고,
대시보드·배송지·결제/환불·찜·사업자/매장 API도 `/api/v1/seller/**`에 구현되어 있다.

### 14.1 셀러 관리자 메뉴 API 매핑

| 메뉴 | Method | 경로 | 주요 응답/처리 |
|---|---|---|---|
| 대시보드 | `GET` | `/api/v1/seller/dashboard` | 매장·주문·주문금액·찜·미확인 알림 집계 |
| 상품 탐색 | `GET` | `/api/v1/products` | `ProductPage` |
| 장바구니 | `GET/POST` | `/api/v1/carts` | `Cart` |
| 주문 | `GET/POST` | `/api/v1/orders`, `/api/v1/orders/from-cart` | `PageResponse<Order>`, `Order[]` |
| 배송지 | `GET/POST/PUT/DELETE` | `/api/v1/seller/addresses/**` | 소매 매장 배송지 |
| 결제·환불 | `GET/POST` | `/api/v1/seller/payments`, `/api/v1/seller/refunds` | 결제·환불 목록/요청 |
| 찜 | `GET/POST/DELETE` | `/api/v1/seller/wishlists/**` | 찜 상품 |
| 문의 | `GET/POST` | `/api/v1/support/inquiries` | 내 문의 |
| 알림 | `GET/PATCH` | `/api/v1/notifications/**` | 내 알림·읽음 처리 |
| 사업자·매장 | `GET` | `/api/v1/seller/business` | 사업자와 연결 소매 매장 |

`/api/v1/seller/**`는 `ROLE_RETAIL`, `ROLE_ADMIN`, `ROLE_SYSTEMADMIN`만 접근 가능하다.
일반 셀러는 요청에 사용자 PK를 보내지 않으며 서버가 토큰의 사용자 PK로 범위를 제한한다.

```ts
export interface SellerDashboard {
  store_count: number;
  order_count: number;
  total_order_amount: number;
  wishlist_count: number;
  unread_notification_count: number;
}

export interface SellerAddress {
  seq: number;
  retail_store_seq: number;
  postal_code: string;
  address1: string;
  address2: string | null;
  is_default: boolean;
}
export interface SellerAddressRequest {
  retailStoreSeq: number;
  postalCode: string;
  address1: string;
  address2?: string | null;
  isDefault: boolean;
}

export interface SellerPayment {
  payment_seq: number;
  order_seq: number;
  order_no: string;
  payment_method: 'CARD' | 'BANK_TRANSFER' | 'VIRTUAL_ACCOUNT';
  status: 'READY' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  amount: number;
  pg_provider: string | null;
  pg_transaction_id: string | null;
  paid_at: string | null;
  refund_seq: number | null;
  refund_amount: number | null;
  refund_reason: string | null;
  refund_status: 'REQUESTED' | 'APPROVED' | 'COMPLETED' | 'REJECTED' | null;
}

export interface RefundRequest { paymentSeq: number; amount: number; reason?: string | null }
export interface WishlistRequest { retailStoreSeq: number; productSeq: number }

export interface SellerWishlist {
  seq: number;
  retail_store_seq: number;
  retail_store_name: string;
  product_seq: number;
  product_name: string;
  image_url: string | null;
  wholesale_store_seq: number;
  wholesale_store_name: string;
  price: number | null; // ACTIVE SKU가 없으면 null
  product_status: string;
  created_at: string;
}

export interface SellerBusinessResponse {
  businessProfiles: Array<{
    seq: number;
    businessNumber: string;
    companyName: string;
    representativeName: string;
    approvalStatus: string;
    approvedAt: string | null;
    stores: Array<{
      seq: number;
      storeName: string;
      salesChannel: string | null;
      status: string;
    }>;
  }>;
}
```

배송지 등록 성공은 `201`, 삭제 성공은 `204`다. `isDefault=true` 저장 시 같은 소매 매장의 기존
기본 배송지는 자동 해제된다. 환불은 `PAID` 또는 부분 환불 중인 결제만 요청할 수 있고, 거절되지
않은 기존 환불과 신규 요청 합계가 결제 금액을 넘으면 `400 C001`이다. 같은 매장·상품을 다시
찜하면 `400 C001`, 찜 삭제 성공은 `204`다.

```ts
export const sellerAdminApi = {
  dashboard: () => api.get<SellerDashboard>('/api/v1/seller/dashboard'),
  addresses: () => api.get<SellerAddress[]>('/api/v1/seller/addresses'),
  createAddress: (body: SellerAddressRequest) => api.post<SellerAddress>('/api/v1/seller/addresses', body),
  updateAddress: (seq: number, body: SellerAddressRequest) => api.put<SellerAddress>(`/api/v1/seller/addresses/${seq}`, body),
  deleteAddress: (seq: number) => api.delete(`/api/v1/seller/addresses/${seq}`),
  payments: () => api.get<SellerPayment[]>('/api/v1/seller/payments'),
  requestRefund: (body: RefundRequest) => api.post('/api/v1/seller/refunds', body),
  wishlists: () => api.get<SellerWishlist[]>('/api/v1/seller/wishlists'),
  addWishlist: (body: WishlistRequest) => api.post<SellerWishlist>('/api/v1/seller/wishlists', body),
  deleteWishlist: (seq: number) => api.delete(`/api/v1/seller/wishlists/${seq}`),
  business: () => api.get<SellerBusinessResponse>('/api/v1/seller/business'),
};
```

도매 관리자 권장 순서: 대시보드, 상품, 주문, 입고, 출고, 재고, 반품·취소, 정산, 거래처,
문의, 알림, 사업자·매장 관리. 현재 상품·주문·입고·출고·재고·문의·알림 API가 구현되어 있고,
대시보드·반품/취소·정산·거래처·사업자/매장 API는 `/api/v1/wholesale/management/**`에 구현되어 있다.

### 14.2 도매 관리자 메뉴 API 매핑

| 메뉴 | Method | 경로 |
|---|---|---|
| 대시보드 | `GET` | `/api/v1/wholesale/management/dashboard` |
| 상품 | `GET/POST/PUT` | `/api/v1/products/**` |
| 주문 | `GET/PATCH` | `/api/v1/wholesale/orders/**` |
| 입고 | `GET/POST/PUT` | `/api/v1/wholesale/stock-receipts/**` |
| 출고 | `GET/POST/PATCH/PUT` | `/api/v1/wholesale/shipments/**` |
| 재고 | `GET/POST/PUT` | `/api/v1/wholesale/inventory/**` |
| 반품·취소 | `GET/PATCH` | `/api/v1/wholesale/management/claims/**` |
| 정산 | `GET/PUT` | `/api/v1/wholesale/management/settlements`, `/payout-accounts/**` |
| 거래처 | `GET` | `/api/v1/wholesale/management/clients` |
| 문의 | `GET/POST` | `/api/v1/support/inquiries` |
| 알림 | `GET/PATCH` | `/api/v1/notifications/**` |
| 사업자·매장 | `GET/PUT` | `/api/v1/wholesale/management/business`, `/stores/{storeSeq}` |

대시보드 응답은 `store_count`, `product_count`, `order_item_count`, `low_stock_count`,
`requested_claim_count`를 반환한다. 재고 부족 기준은 현재 `available_quantity <= 5`다.

클레임 `claim_type`은 `CANCEL | RETURN`, 상태는 `REQUESTED | APPROVED | REJECTED | COMPLETED`다.
상태 변경 body는 `{ "status": "APPROVED" }` 형식이며 `REQUESTED → APPROVED → COMPLETED` 또는
`REQUESTED → REJECTED`만 허용한다. 잘못된 상태 전이는 `409 O005`다.

정산 목록은 매장명, 기간, 총 거래액, 수수료, 지급 예정액, 상태를 반환한다. 정산계좌 저장은
`PUT /api/v1/wholesale/management/payout-accounts/{storeSeq}`에 `bankName`, `accountNumber`,
`accountHolder`를 전송한다. 거래처 목록은 주문 이력이 있는 소매 매장별 주문 수, 누적 금액,
최근 주문 시각을 반환한다. 모든 API는 로그인 사용자가 소유한 도매 매장만 포함한다.

```ts
export const wholesaleManagementApi = {
  dashboard: () => api.get('/api/v1/wholesale/management/dashboard'),
  claims: (status?: string) => api.get('/api/v1/wholesale/management/claims', { params: { status } }),
  updateClaimStatus: (seq: number, status: string) => api.patch(`/api/v1/wholesale/management/claims/${seq}/status`, { status }),
  settlements: () => api.get('/api/v1/wholesale/management/settlements'),
  payoutAccounts: () => api.get('/api/v1/wholesale/management/payout-accounts'),
  savePayoutAccount: (storeSeq: number, body: { bankName: string; accountNumber: string; accountHolder: string }) => api.put(`/api/v1/wholesale/management/payout-accounts/${storeSeq}`, body),
  clients: () => api.get('/api/v1/wholesale/management/clients'),
  business: () => api.get('/api/v1/wholesale/management/business'),
};
```

### 14.3 공통 문의 API

| 기능 | Method | 경로 | 응답 |
|---|---|---|---|
| 내 문의 목록 | `GET` | `/api/v1/support/inquiries` | `Inquiry[]` |
| 문의 등록 | `POST` | `/api/v1/support/inquiries` | `Inquiry` |

```ts
export interface Inquiry {
  seq: number;
  category: string;
  title: string;
  content: string;
  status: string;
}

export interface InquiryCreateRequest {
  category: string; // 최대 50자
  title: string;    // 최대 200자
  content: string;
}
```

등록 성공은 `201 Created`다. 로그인 사용자의 문의만 반환하며 초기 상태는 `OPEN`이다.

### 14.4 공통 알림 API

| 기능 | Method | 경로 | 응답 |
|---|---|---|---|
| 내 알림 목록 | `GET` | `/api/v1/notifications` | `Notification[]` |
| 읽음 처리 | `PATCH` | `/api/v1/notifications/{notificationSeq}/read` | `Notification` |

```ts
export interface Notification {
  seq: number;
  type: string;
  title: string;
  message: string;
  readAt: string | null;
}
```

목록은 최신 PK 순이며 로그인 사용자의 알림만 반환한다. 읽음 처리는 멱등이며 이미 읽은 알림의
`readAt`은 변경하지 않는다. 다른 사용자의 알림 식별자는 응답에 노출하거나 변경하지 않는다.

```ts
export const adminCommonApi = {
  inquiries: () => api.get<Inquiry[]>('/api/v1/support/inquiries'),
  createInquiry: (body: InquiryCreateRequest) =>
    api.post<Inquiry>('/api/v1/support/inquiries', body),
  notifications: () => api.get<Notification[]>('/api/v1/notifications'),
  readNotification: (seq: number) =>
    api.patch<Notification>(`/api/v1/notifications/${seq}/read`),
};
```

## 15. 현재 확인이 필요한 정책

다음 항목은 현재 코드에 완전한 계약이 없으므로 프론트에서 임의로 확정하지 않는다.

1. 사용자 `status`의 전체 허용값과 상태 전이 규칙
2. `PENDING` 사용자의 로그인 허용 여부
3. 비밀번호 최소 길이, 조합 및 변경 주기
4. 휴대폰 번호 정규화 형식
5. access token의 최종 저장 방식
6. 일반 오류 응답 envelope 단일화 여부
7. `REQUIRED_DATA_NOT_FOUND`의 HTTP Status를 `404`로 유지할지 여부
8. 상품 `status`의 전체 허용값과 상태 전이 규칙
9. 도매상·카테고리 존재 여부 및 접근 권한 검증 정책
10. 상품 API와 기존 사용자 API의 성공·오류 envelope 단일화 여부
11. 장바구니 단계의 판매 상태·재고·최소 주문 수량 검증 정책
12. 사업자 대표 사용자와 실제 주문 처리 사용자가 다를 때 주문자 확정 방식
13. 사용자에게 소매 매장이 여러 개인 경우 주문 매장 선택 방식

14. 서비스 관리자 API의 역할 기반 접근 제어 방식
15. 배송비·할인 계산 정책과 `shippingAddressSeq` 소유권 검증 방식
16. 주문 취소 상태 전이와 취소 시 예약 재고 복구 정책

## 16. 변경 이력

| 날짜 | 변경 내용 |
|---|---|
| 2026-08-25 | 로그인 아이디 `userId`를 제외한 관계 참조를 `*Seq`로 통일하고 상품 API의 `wholesaleStoreId`를 `wholesaleStoreSeq`로 변경 |
| 2026-08-25 | 도매 관리자 대시보드·반품/취소·정산·거래처·사업자/매장 API 및 전체 메뉴 매핑 추가 |
| 2026-08-25 | 셀러 관리자 대시보드·배송지·결제/환불·찜·사업자/매장 API 및 전체 메뉴 매핑 추가 |
| 2026-08-25 | 셀러·도매 관리자 추가 메뉴 구성과 공통 문의·알림 API 계약 추가 |
| 2026-08-24 | 장바구니 주문을 도매 매장별 주문·발주번호로 분리하고 생성 응답을 `Order[]`로 변경 |
| 2026-08-24 | 관리자·도매·셀러 메뉴 목록을 QueryDSL 동적 조건과 공통 `PageResponse<T>` 계약으로 전환 |
| 2026-08-24 | 셀러 관리자 내 주문 목록·상세 응답에 도매 출고·배송 진행 정보 `shipments` 추가 |
| 2026-08-21 | 주문관리 도매 매장 선택 목록을 로그인 사용자의 소유 매장만 반환하는 `/api/v1/wholesale/stores`로 확정 |
| 2026-08-20 | 도매 주문 목록·상태 변경을 로그인 사용자의 소유 도매 매장 범위로 제한하는 계약 명시 |
| 2026-08-20 | 장바구니 조회 시 소매 사업자·매장이 없는 사용자도 `buyer`의 관련 필드를 `null`로 반환하도록 변경 |
| 2026-08-20 | 도매상품 재고 API를 관리자 경로에서 도매 경로 `/api/v1/wholesale/inventory`로 이동 |
| 2026-08-20 | 도매상품 입고 API를 관리자 경로에서 도매 경로 `/api/v1/wholesale/stock-receipts`로 이동 |
| 2026-08-19 | 상품 목록·상세 응답에 도매 매장명 `wholesaleStoreName` 추가 |
| 2026-08-19 | 사용자 도매·소매 유형, 관리자 역할, 로그인 화면 분기 및 관리 범위 계약 추가 |
| 2026-08-14 | 도매상품 입고 목록·등록·수정 및 완료 시 재고 반영 계약 추가 |
| 2026-08-13 | 출고관리 택배사 직접 입력을 활성 택배사 목록 select 방식으로 변경 |
| 2026-08-13 | 서비스 관리자 택배사 관리 메뉴용 목록·등록·수정 계약 추가 |
| 2026-08-12 | 신규 `PRODUCT_ORDERED`와 레거시 `CREATED` 주문상품의 호환 처리 계약 확정 |
| 2026-08-11 | 도매 주문 상품 상태 전이, 자동 출고 생성, 출고 목록·상태·수량 변경 계약 추가 |
| 2026-08-11 | 공통 오류 메시지 한글화 및 주문 업무 오류 상세 메시지 노출 계약 추가 |
| 2026-08-11 | 상품 재고 다건 등록·수정 벌크 계약 추가 |
| 2026-08-11 | 서비스 관리자 상품 재고 목록·등록·수정 계약 추가 |
| 2026-08-11 | 선택 장바구니 주문 생성·내 주문 조회·관리자 주문 목록 계약 추가 |
| 2026-08-10 | 서비스 관리자 사업자 프로필·도매상 매장·소매상 매장 목록/등록/수정 계약 추가 |
| 2026-08-10 | 서비스 관리자 사용자 목록·등록·수정 계약 추가 |
| 2026-08-10 | 최신 단일 `carts` 테이블에 맞춰 장바구니를 로그인 `userSeq` 기준으로 변경하고 API 경로 재정의 |
| 2026-08-03 | 장바구니에 소매 주문자 정보를 추가하고 상품을 도매처별 사업자 정보와 함께 그룹화 |
| 2026-07-31 | 장바구니 목록·상품 추가·수량 수정·삭제 API 계약 추가 |
| 2026-07-27 | 상품 참조 식별자를 `productId` / `product_id`에서 `productSeq` / `product_seq`로 변경 |
| 2026-07-27 | 카테고리 트리 목록·등록·수정 API 계약 추가 |
| 2026-07-27 | 상품 카테고리 필드와 DB 컬럼을 `categorySeq` / `category_seq`로 변경 |
| 2026-07-25 | 상품 목록·상세·등록·수정 API 계약 및 상태별 처리 기준 추가 |
| 2026-07-24 | 최초 작성. 회원가입, 로그인, 사용자 조회, 토큰 재발급, 로그아웃 계약 정리 |
