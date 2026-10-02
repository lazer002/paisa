import { store } from '@/app/store'
import { logout } from '@/lib/store/authSlice'
import { doRefresh } from '@/lib/api/refresh'

export async function bootstrapAuth(): Promise<void> {
  if (store.getState().auth.token) return

  const token = await doRefresh()

  if (!token) {
    store.dispatch(logout())
  }
}