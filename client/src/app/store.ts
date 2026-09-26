import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux'

import authReducer from '@/lib/store/authSlice'
import { organizationsApi } from '@/features/organizations/organizationsApi'
import { usersApi } from '@/features/users/usersApi'

const rootReducer = combineReducers({
  auth: authReducer,
  [organizationsApi.reducerPath]: organizationsApi.reducer,
  [usersApi.reducerPath]: usersApi.reducer,
})

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefault) =>
    getDefault().concat(organizationsApi.middleware, usersApi.middleware),
})

setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
