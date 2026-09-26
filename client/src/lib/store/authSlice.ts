import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface AuthUser {
  _id: string
  name: string
  email: string
  role: string
}

export interface AuthState {
  user: AuthUser | null
  // Access token lives ONLY in memory (Redux). A page refresh clears it —
  // the httpOnly refresh cookie silently restores it on boot.
  // XSS can read memory too, but the token expires in 15 minutes and cannot
  // be used to mint new ones — only the httpOnly cookie can, and scripts
  // can never touch that.
  token: string | null
}

const PROFILE_KEY = 'auth-profile'

function loadPersistedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

function persistUser(user: AuthUser | null) {
  try {
    if (user) localStorage.setItem(PROFILE_KEY, JSON.stringify(user))
    else localStorage.removeItem(PROFILE_KEY)
  } catch {
    /* storage unavailable */
  }
}

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: loadPersistedUser(), token: null } as AuthState,
  reducers: {
    setAuth(state, action: PayloadAction<{ user: AuthUser; token: string }>) {
      state.user = action.payload.user
      state.token = action.payload.token
      persistUser(action.payload.user)
    },
    // Silent refresh only renews the token; user may have been updated too
    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload
    },
    logout(state) {
      state.user = null
      state.token = null
      persistUser(null)
    },
  },
})

export const { setAuth, setToken, logout } = authSlice.actions
export default authSlice.reducer
