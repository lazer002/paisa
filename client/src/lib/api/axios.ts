import axios, { AxiosError } from 'axios'
import { store } from '@/app/store'
import { logout } from '@/lib/store/authSlice'
import { doRefresh } from '@/lib/api/refresh'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  withCredentials: true, // send the httpOnly refresh cookie
})

// ─── Attach access token from memory ─────────────────────────────────────────

api.interceptors.request.use((config) => {
  const token = store.getState().auth.token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Transparent 401 → refresh → retry ───────────────────────────────────────

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (AxiosError['config'] & { _retried?: boolean }) | undefined

    if (
      error.response?.status === 401 &&
      original &&
      !original._retried &&
      !original.url?.includes('/auth/refresh') &&
      !original.url?.includes('/auth/login')
    ) {
      original._retried = true

      const newToken = await doRefresh()

      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original) // retry once with the fresh token
      }

      // Refresh failed — session is truly gone
      store.dispatch(logout())
      window.location.href = '/login'
    }

    return Promise.reject(error)
  },
)

export default api
