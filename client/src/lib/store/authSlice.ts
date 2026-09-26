import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface AuthUser {
  _id: string
  name: string
  email: string
  role: string
}

export interface AuthState {
  user: AuthUser | null
  token: string | null
}

const STORAGE_KEY = 'auth-storage'

function loadPersisted(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { user: null, token: null }
    const parsed = JSON.parse(raw)
    const state = parsed?.state
    if (state && typeof state === 'object' && 'user' in state) {
      return { user: state.user ?? null, token: state.token ?? null }
    }
    return { user: null, token: null }
  } catch {
    return { user: null, token: null }
  }
}

const authSlice = createSlice({
  name: 'auth',
  initialState: loadPersisted,
  // lazily read localStorage at store creation
  reducers: {
    setAuth(state, action: PayloadAction<{ user: AuthUser; token: string }>) {
      state.user = action.payload.user
      state.token = action.payload.token
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ state: { user: action.payload.user, token: action.payload.token }, version: 0 }),
        )
      } catch {
        /* storage full / unavailable */
      }
    },
    logout(state) {
      state.user = null
      state.token = null
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        /* ignore */
      }
    },
  },
})

export const { setAuth, logout } = authSlice.actions
export default authSlice.reducer
