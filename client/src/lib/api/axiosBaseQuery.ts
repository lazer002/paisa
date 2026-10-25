// client/src/lib/api/axiosBaseQuery.ts

import axios from 'axios'
import type { AxiosRequestConfig, RawAxiosHeaders } from 'axios'
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query'
import api from './axios'

export const axiosBaseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args) => {
  try {
    const config: AxiosRequestConfig =
      typeof args === 'string'
        ? {
            url: args,
          }
        : {
            url: args.url,
            method: args.method as AxiosRequestConfig['method'],
            data: args.body,
            params: args.params,
            headers:
              args.headers && typeof args.headers === 'object'
                ? axios.AxiosHeaders.from(args.headers as RawAxiosHeaders)
                : undefined,
          }

    const result = await api.request(config)

    return {
      data: result.data,
    }
  } catch (err) {
    const e = err as {
      response?: { status?: number; data?: unknown }
      message?: string
    }
    return {
      error: {
        status: e?.response?.status ?? 500,
        data:
          e?.response?.data ?? {
            message: e?.message ?? 'Network error',
          },
      } as FetchBaseQueryError,
    }
  }
}