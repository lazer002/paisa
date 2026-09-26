import type { AxiosRequestConfig } from 'axios'
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query'
import api from './axios'

/**
 * RTK Query baseQuery backed by the shared axios instance.
 * All the auth logic (Bearer attach, 401 → silent refresh → retry)
 * lives in the axios interceptors, so RTK Query gets it for free.
 */
export const axiosBaseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, _api, _extraOptions) => {
  try {
    const config: AxiosRequestConfig =
      typeof args === 'string' ? { url: args } : { url: args.url, method: args.method, data: args.body, params: args.params }

    const result = await api.request(config)

    return { data: result.data }
  } catch (err: any) {
    return {
      error: {
        status: err?.response?.status ?? 500,
        data: err?.response?.data ?? { message: err?.message ?? 'Network error' },
      } as FetchBaseQueryError,
    }
  }
}
