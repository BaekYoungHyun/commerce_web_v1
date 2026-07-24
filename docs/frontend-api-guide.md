# Commerce 프론트엔드 API 개발 가이드

> 최종 갱신일: 2026-07-24  
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

성공 응답의 `data` 구조는 로그인 응답과 같다.

#### 재발급 실패 처리

- HTTP `401` 또는 토큰 관련 오류가 반환되면 로컬 인증 상태를 제거한다.
- 재발급 API 자체에 대해 다시 재발급을 시도하지 않는다.
- 동시에 여러 API가 `401`을 반환하면 재발급 요청은 하나만 수행하고 나머지는 대기시킨다.

Axios 인터셉터 구현 시 무한 루프 방지 플래그를 사용한다.

```ts
if (error.response?.status === 401 && !config._retry) {
  config._retry = true;
  await refreshAccessToken();
  return api(config);
}
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

## 6. 토큰 저장 및 보안

- 비밀번호, access token을 콘솔이나 분석 이벤트에 기록하지 않는다.
- 현재 access token은 응답 body로 전달된다.
- 저장 방식은 프론트 보안 정책에 따라 결정하되 XSS 위험이 있는 영구 저장소 사용을 최소화한다.
- 로그아웃 시 토큰, 사용자 정보 및 인증 관련 캐시를 모두 제거한다.
- API 요청 로그에 `Authorization` 헤더가 출력되지 않도록 한다.

## 7. 권장 Pinia 상태

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

## 8. 프론트 완료 기준

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

## 9. 현재 확인이 필요한 정책

다음 항목은 현재 코드에 완전한 계약이 없으므로 프론트에서 임의로 확정하지 않는다.

1. 사용자 `status`의 전체 허용값과 상태 전이 규칙
2. `PENDING` 사용자의 로그인 허용 여부
3. 비밀번호 최소 길이, 조합 및 변경 주기
4. 휴대폰 번호 정규화 형식
5. access token의 최종 저장 방식
6. 일반 오류 응답 envelope 단일화 여부
7. `REQUIRED_DATA_NOT_FOUND`의 HTTP Status를 `404`로 유지할지 여부

## 10. 변경 이력

| 날짜 | 변경 내용 |
|---|---|
| 2026-07-24 | 최초 작성. 회원가입, 로그인, 사용자 조회, 토큰 재발급, 로그아웃 계약 정리 |

