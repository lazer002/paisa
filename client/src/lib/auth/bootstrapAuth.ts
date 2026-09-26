import { store } from '@/app/store'
import { setToken, logout } from '@/lib/store/authSlice'
import { doRefresh } from '@/lib/api/refresh'

/**
 * Called once on app mount. If the browser still holds a valid httpOnly
 * refresh cookie, we silently obtain a fresh access token — the user
 * stays logged in across refreshes without any token ever touching
 * localStorage.
 */
export async function bootstrapAuth(): Promise<void> {
  // Already have a live token in memory — nothing to do
  if (store.getState().auth.token) return

  const token = await doRefresh()
  if (!token) {
    // No valid session — clear any stale profile so AuthGuard sends us to /login
    store.dispatch(logout())
  }
}
