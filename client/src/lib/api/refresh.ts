import axios from 'axios'
import { store } from '@/app/store'
import { setAuth, setToken } from '@/lib/store/authSlice'

let refreshPromise: Promise<string | null> | null = null

/**
 * Exchange the httpOnly refresh cookie for a fresh access token.
 * Single-flight: concurrent callers share one request.
 */
export function doRefresh(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const baseURL =
          import.meta.env.VITE_API_URL ?? "/api";

        const res = await axios.post(
          `${baseURL}/auth/refresh`,
          {},
          {
            withCredentials: true,
          }
        );

        const accessToken =
          res.data?.data?.accessToken;

        if (!accessToken) {
          return null;
        }

        const user =
          res.data?.data?.user;

        if (user) {
          store.dispatch(
            setAuth({
              user,
              token: accessToken,
            })
          );
        } else {
          store.dispatch(
            setToken(accessToken)
          );
        }

        return accessToken;
      } catch (error) {
        console.error(
          "REFRESH FAILED:",
          error
        );

        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}
