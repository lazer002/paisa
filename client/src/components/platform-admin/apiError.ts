/**
 * Pull the server's `{ message }` out of an RTK Query / axiosBaseQuery error.
 * The server envelope on failure is `{ success:false, message, code }`.
 */
export function apiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  const e = error as {
    data?: { message?: unknown }
    error?: unknown
    message?: unknown
  } | null
  const message = e?.data?.message ?? e?.message ?? e?.error
  return typeof message === 'string' && message.trim() ? message : fallback
}
