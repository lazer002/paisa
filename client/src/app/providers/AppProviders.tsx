import { Provider } from 'react-redux'
import { ReactNode, useEffect, useState } from 'react'
import { store } from '@/app/store'
import { bootstrapAuth } from '@/lib/auth/bootstrapAuth'

interface Props {
  children: ReactNode
}

export function AppProviders({ children }: Props) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    bootstrapAuth().finally(() => setReady(true))
  }, [])

  return <Provider store={store}>{ready ? children : null}</Provider>
}