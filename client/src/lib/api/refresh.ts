// client/src/lib/api/refresh.ts

import axios from 'axios'
import { store } from '@/app/store'
import { setAuth, setToken } from '@/lib/store/authSlice'

let refreshPromise: Promise<string | null> | null = null

export function doRefresh(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = (async () => {
    try {
      const baseURL = import.meta.env.VITE_API_URL ?? '/api'

      const res = await axios.post(
        `${baseURL}/auth/refresh`,
        {},
        {
          withCredentials: true,
        },
      )

      const accessToken = res.data?.data?.accessToken

      if (!accessToken) {
        return null
      }

      const user = res.data?.data?.user

      if (user) {
        store.dispatch(
          setAuth({
            user,
            token: accessToken,
          }),
        )
      } else {
        store.dispatch(setToken(accessToken))
      }

      return accessToken
    } catch (error) {
      console.error('REFRESH FAILED:', error)

      return null
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}