const API_BASE_URL = String(
  import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? '',
).replace(/\/$/, '')

export interface ApiResponse<T> {
  status: number
  message: string
  code: number
  data: T
  dataTime: string
  httpStatus: string
}

export interface ApiErrorResponse {
  timestamp?: string
  status: number
  error?: string
  code: string | number
  message: string
  errors?: Array<{ field: string; message: string }>
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code: string | number | null = null,
    public fieldErrors: Record<string, string> = {},
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const normalizedPath = `/${path.replace(/^\/+/, '')}`
  const response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as Partial<ApiErrorResponse> | null
    const fieldErrors = Object.fromEntries(
      (body?.errors ?? []).map((error) => [error.field, error.message]),
    )
    throw new ApiError(
      response.status,
      body?.message ?? '요청 처리 중 오류가 발생했습니다.',
      body?.code ?? null,
      fieldErrors,
    )
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
