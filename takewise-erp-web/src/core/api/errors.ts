import { isAxiosError } from 'axios'

export type ApiErrorCode =
  | 'NETWORK'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'SERVER'
  | 'UNKNOWN'

export class ApiError extends Error {
  readonly code: ApiErrorCode
  readonly status: number | undefined
  readonly fieldErrors: Record<string, string[]> | undefined

  constructor(
    code: ApiErrorCode,
    message: string,
    status?: number,
    fieldErrors?: Record<string, string[]>,
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

// Assumed server error shape: { message?: string; errors?: Record<string, string[]> }
interface ServerErrorBody {
  message?: string
  errors?: Record<string, string[]>
}

function codeFromStatus(status: number): ApiErrorCode {
  if (status === 401) return 'UNAUTHORIZED'
  if (status === 403) return 'FORBIDDEN'
  if (status === 404) return 'NOT_FOUND'
  if (status === 400 || status === 422) return 'VALIDATION'
  if (status >= 500) return 'SERVER'
  return 'UNKNOWN'
}

export function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (isAxiosError<ServerErrorBody>(error)) {
    if (!error.response) {
      return new ApiError('NETWORK', 'Unable to reach the server. Check your connection.')
    }
    const { status, data } = error.response
    return new ApiError(
      codeFromStatus(status),
      data?.message ?? error.message,
      status,
      data?.errors,
    )
  }

  return new ApiError('UNKNOWN', error instanceof Error ? error.message : 'Unexpected error')
}