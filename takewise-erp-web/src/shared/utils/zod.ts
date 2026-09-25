import type { ZodError } from 'zod'

// Converts Zod issues into { fieldName: firstMessage } for forms
export function toFieldErrors(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path[0]
    if (typeof key === 'string' && !errors[key]) errors[key] = issue.message
  }
  return errors
}

// Converts server field errors { field: ['msg', ...] } into { field: 'msg' }
export function toFieldErrorsFromApi(errors?: Record<string, string[]>): Record<string, string> {
  const result: Record<string, string> = {}
  if (!errors) return result
  for (const [key, messages] of Object.entries(errors)) {
    const first = messages[0]
    if (first) result[key] = first
  }
  return result
}