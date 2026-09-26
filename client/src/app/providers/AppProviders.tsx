import { Provider } from 'react-redux'
import { ReactNode } from 'react'
import { store } from '@/app/store'

interface Props {
  children: ReactNode
}

export function AppProviders({ children }: Props) {
  return <Provider store={store}>{children}</Provider>
}