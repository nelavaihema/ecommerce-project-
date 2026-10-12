/** Turns SDK / fetch errors into a short, user-safe message. */
export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (!error) return fallback
  if (typeof error === "string") return error
  if (error instanceof Error) {
    const msg = error.message || ""
    if (/fetch failed|ECONNREFUSED|NetworkError|Failed to fetch/i.test(msg)) {
      return "We couldn't reach the store right now. Please check your connection and try again."
    }
    return msg.length > 200 ? fallback : msg || fallback
  }
  return fallback
}

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
