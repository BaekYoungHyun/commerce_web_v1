# Commerce 프론트엔드 API 개발 가이드

> 최종 갱신일: 2026-07-31  
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

## 3. 공통 응답 계약

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
  status?: string;
}
```

```json
{
  "userId": "test-user-01",
  "passwd": "password1234!",
  "phone": "01012345678",
  "name": "테스트 사용자"
}
```

#### 필드 검증

| 필드 | 필수 | 최대 길이 | 프론트 처리 |
|---|---:|---:|---|
| `userId` | Y | 255 | 앞뒤 공백을 제거한다. |
| `passwd` | Y | 500 | 공백 여부를 확인하고 로그에 남기지 않는다. |
| `phone` | Y | 30 | 앞뒤 공백을 제거한다. |
| `name` | Y | 100 | 앞뒤 공백을 제거한다. |
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
    "accessTokenExpiresIn": 1784878245000
  },
  "dataTime": "2026-07-24 15:30:45",
  "httpStatus": "OK"
}
```

`accessTokenExpiresIn`은 남은 초가 아니라 만료 시각의 Unix epoch millisecond다.

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
- 권한: 상품 경로에 별도 역할 제한은 없고 로그인 사용자라면 접근 가능하다.
- 등록·수정 Content-Type: `application/json`. 이미지 파일이 아니라 업로드 완료된 URL을 전송한다.
- 성공 응답: 공통 `ApiResponse`로 감싸지 않은 DTO 원문이다.
- 금액: JSON number이며 프론트에서는 원 단위 정수 입력을 권장한다.
- 상태 허용 목록: 아직 enum으로 확정되지 않았다. 현재 기본값은 상품 `DRAFT`, SKU `ACTIVE`다.

### 7.1 상품 타입

```ts
export interface Product {
  seq: number;
  wholesaleStoreId: number;
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
| `wholesaleStoreId` | N |  | 도매상 식별자 일치 검색 |
| `categorySeq` | N |  | 선택 카테고리 자신과 모든 하위 카테고리를 포함한 검색 |
| `status` | N |  | 상품 상태 일치 검색 |
| `name` | N |  | 상품명 대소문자 무시 부분 검색 |

정렬은 `createdAt DESC`로 고정되어 있다.

프론트 처리 기준:

- `page < 0`은 `0`, `size < 1`은 `1`, `size > 100`은 `100`으로 서버에서 보정한다.
- `status`는 완전 일치 검색이고 `name`은 대소문자를 무시한 부분 일치 검색이다.
- 1depth `categorySeq`를 보내면 해당 1depth와 모든 하위 카테고리의 상품이 함께 조회된다. 2depth 또는 더 하위 카테고리도 동일하게 자신과 자손 범위로 조회된다.
- 목록 항목에도 `images`, `options`, `variants`, `viewCount`가 모두 포함된다.
- 이미지는 `sortOrder ASC, seq ASC`, 옵션은 `sortOrder ASC, seq ASC`, SKU는 `seq ASC` 순서다.
- 대표 이미지는 `images[0]`을 사용하되 빈 배열에 대비해 fallback 이미지를 준비한다.
- 서버의 목록 동적 조건과 페이징은 QueryDSL로 처리되며 기존 요청·응답 계약에는 영향이 없다.

```http
GET /api/v1/products?page=0&size=20&status=DRAFT&name=셔츠
```

성공 응답:

```json
{
  "content": [
    {
      "seq": 1,
      "wholesaleStoreId": 10,
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
  "wholesaleStoreId": 1,
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
  wholesaleStoreId: number;
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
  "wholesaleStoreId": 10,
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
| `wholesaleStoreId` | Y | 1 이상의 정수 |
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
  wholesaleStoreId: number;
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
  "wholesaleStoreId": 1,
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
  wholesaleStoreId?: number;
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
  cartSeq: number;
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

export interface Cart {
  cartSeq: number;
  retailStoreSeq: number;
  items: CartItem[];
  totalQuantity: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
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
| 장바구니 목록 | `GET` | `/api/v1/carts/{cartSeq}/items` | `200` | `Cart` |
| 상품 추가 | `POST` | `/api/v1/carts/{cartSeq}/items` | `201` | `CartItem` |
| 수량 수정 | `PUT` | `/api/v1/carts/{cartSeq}/items/{cartItemSeq}` | `200` | `CartItem` |
| 상품 삭제 | `DELETE` | `/api/v1/carts/{cartSeq}/items/{cartItemSeq}` | `204` | body 없음 |

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

- `quantity`는 `1` 이상이어야 한다.
- `variantSeq`는 요청한 `productSeq`에 속해야 한다.
- 같은 장바구니에 동일 variant를 다시 추가하면 새 행을 만들지 않고 기존 수량에 합산한다.
- 목록은 최근 담은 항목 순이며 대표 이미지는 `sortOrder`, `seq`가 가장 빠른 이미지다.
- 삭제 성공 시 `204`이므로 JSON body를 파싱하지 않는다.

```ts
export const cartApi = {
  list: (cartSeq: number) =>
    api.get<Cart>(`/api/v1/carts/${cartSeq}/items`).then(({ data }) => data),

  add: (cartSeq: number, request: CartItemAddRequest) =>
    api.post<CartItem>(`/api/v1/carts/${cartSeq}/items`, request)
      .then(({ data }) => data),

  updateQuantity: (
    cartSeq: number,
    cartItemSeq: number,
    request: CartItemUpdateRequest,
  ) =>
    api.put<CartItem>(
      `/api/v1/carts/${cartSeq}/items/${cartItemSeq}`,
      request,
    ).then(({ data }) => data),

  remove: (cartSeq: number, cartItemSeq: number) =>
    api.delete<void>(`/api/v1/carts/${cartSeq}/items/${cartItemSeq}`),
};
```

### 8.3 오류 및 화면 상태

| HTTP Status | 코드 | 상황 | 프론트 처리 |
|---:|---|---|---|
| `400` | `C001` | 수량이 1 미만이거나 필수값 누락 | 수량 입력 오류를 표시한다. |
| `404` | `CART001` | 장바구니 없음 | 장바구니 식별자를 다시 조회한다. |
| `404` | `CART002` | 해당 장바구니에 상품 행 없음 | 목록을 다시 조회한다. |
| `404` | `P001` | 상품 없음 | 판매 종료 안내 후 상품을 제거하거나 갱신한다. |
| `404` | `P003` | variant 없음 또는 상품과 불일치 | 옵션 선택을 다시 받는다. |
| `409` | `CART003` | 저장된 상품·variant 참조 불일치 | 목록 재조회 후 계속되면 관리자에게 문의한다. |

현재 미확정 정책:

- 로그인 사용자와 `cartSeq` 소유 매장(`retailStoreSeq`)의 권한 연결 방식
- 판매 중지 상품·비활성 variant의 장바구니 추가 허용 여부
- 재고 및 상품별 최소 주문 수량을 장바구니 단계에서 검증할지 여부
- 장바구니 생성/조회와 사용자별 기본 장바구니 선택 API

권한 정책이 확정되기 전까지 프론트는 다른 매장의 `cartSeq`를 추측하거나 직접 입력받지
않고, 서버에서 전달받은 식별자만 사용한다.

## 9. 토큰 저장 및 보안

- 비밀번호, access token을 콘솔이나 분석 이벤트에 기록하지 않는다.
- 현재 access token은 응답 body로 전달된다.
- 저장 방식은 프론트 보안 정책에 따라 결정하되 XSS 위험이 있는 영구 저장소 사용을 최소화한다.
- 로그아웃 시 토큰, 사용자 정보 및 인증 관련 캐시를 모두 제거한다.
- API 요청 로그에 `Authorization` 헤더가 출력되지 않도록 한다.

## 10. 권장 Pinia 상태

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

## 11. 프론트 완료 기준

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

## 12. 현재 확인이 필요한 정책

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
11. 로그인 사용자와 장바구니 소유 매장의 권한 연결 방식
12. 장바구니 단계의 판매 상태·재고·최소 주문 수량 검증 정책
13. 사용자별 기본 장바구니 생성 및 조회 정책

## 13. 변경 이력

| 날짜 | 변경 내용 |
|---|---|
| 2026-07-31 | 장바구니 목록·상품 추가·수량 수정·삭제 API 계약 추가 |
| 2026-07-27 | 상품 참조 식별자를 `productId` / `product_id`에서 `productSeq` / `product_seq`로 변경 |
| 2026-07-27 | 카테고리 트리 목록·등록·수정 API 계약 추가 |
| 2026-07-27 | 상품 카테고리 필드와 DB 컬럼을 `categorySeq` / `category_seq`로 변경 |
| 2026-07-25 | 상품 목록·상세·등록·수정 API 계약 및 상태별 처리 기준 추가 |
| 2026-07-24 | 최초 작성. 회원가입, 로그인, 사용자 조회, 토큰 재발급, 로그아웃 계약 정리 |
