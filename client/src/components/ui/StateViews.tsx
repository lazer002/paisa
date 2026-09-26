import { ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Inbox } from 'lucide-react'
import Button from './button'

export function LoadingList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100" />
      ))}
    </div>
  )
}

export function LoadingGrid({ cards = 8, height = 'h-52' }: { cards?: number; height?: string }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className={`${height} animate-pulse rounded-2xl bg-gray-100`} />
      ))}
    </div>
  )
}

export function ErrorState({ message = 'Failed to load data', onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 text-center shadow-sm">
      <AlertTriangle size={40} className="mb-3 text-gray-300" />
      <p className="font-medium text-gray-500">{message}</p>
      <p className="mt-1 text-sm text-gray-400">Check that the backend is running</p>
      {onRetry && (
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          <RefreshCw size={15} /> Retry
        </Button>
      )}
    </div>
  )
}

export function EmptyState({
  icon, title, hint, action,
}: {
  icon: ReactNode
  title: string
  hint?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 text-center shadow-sm">
      <div className="mb-4 text-gray-200">{icon}</div>
      <h3 className="font-semibold text-gray-500">{title}</h3>
      {hint && <p className="mt-1 text-sm text-gray-400">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return <LoadingList rows={rows} />
}

export { Inbox as InboxIcon }
