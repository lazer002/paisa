// client/src/lib/api/axios.ts

import axios, { AxiosError } from 'axios'
import { store } from '@/app/store'
import { logout } from '@/lib/store/authSlice'
import { doRefresh } from '@/lib/api/refresh'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = store.getState().auth.token

  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (res) => res,

  async (error: AxiosError) => {
    const original = error.config as
      | (AxiosError['config'] & {
          _retried?: boolean
        })
      | undefined

    if (
      error.response?.status === 401 &&
      original &&
      !original._retried &&
      !original.url?.includes('/auth/refresh') &&
      !original.url?.includes('/auth/login')
    ) {
      original._retried = true

      try {
        const newToken = await doRefresh()

        if (newToken) {
          original.headers = original.headers ?? {}
          original.headers.Authorization = `Bearer ${newToken}`

          return api(original)
        }
      } catch {
        // fall through to logout
      }

      // Refresh failed → session is expired
      store.dispatch(logout())

      // Replace instead of href so the protected page
      // cannot remain mounted in browser history.
      if (window.location.pathname !== '/login') {
        window.location.replace('/login')
      }

      return Promise.reject(error)
    }

    return Promise.reject(error)
  },
)

export default api