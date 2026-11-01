import { Provider } from 'react-redux'
import { ReactNode, useEffect, useState } from 'react'
import { store } from '@/app/store'
import { bootstrapAuth } from '@/lib/auth/bootstrapAuth'
import { installRealtimeCacheSync, startRealtime } from '@/lib/realtime'

interface Props {
  children: ReactNode
}

export function AppProviders({ children }: Props) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    bootstrapAuth().finally(() => {
      // Socket follows the auth slice from here on: connects with the
      // in-memory token, picks up refreshed tokens, disconnects on logout.
      installRealtimeCacheSync()
      startRealtime()
      setReady(true)
    })
  }, [])

  return <Provider store={store}>{ready ? children : null}</Provider>
}