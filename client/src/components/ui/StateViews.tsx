import { ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Inbox } from 'lucide-react'
import Button from './button'

export function LoadingList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="p-card space-y-2 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />
      ))}
    </div>
  )
}

export function LoadingGrid({ cards = 8, height = 'h-52' }: { cards?: number; height?: string }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className={`${height} animate-pulse rounded-xl bg-gray-200/70`} />
      ))}
    </div>
  )
}

export function ErrorState({ message = 'Failed to load data', onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="p-card flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 rounded-full bg-[#fedad9] p-3 text-[#8e0b21]">
        <AlertTriangle size={22} />
      </div>
      <p className="text-sm font-semibold text-gray-900">{message}</p>
      <p className="mt-1 text-sm text-gray-500">Check your connection or that the server is running.</p>
      {onRetry && (
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          <RefreshCw size={14} /> Retry
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
    <div className="p-card flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 text-gray-300">{icon}</div>
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {hint && <p className="mt-1 max-w-sm text-sm text-gray-500">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return <LoadingList rows={rows} />
}

export { Inbox as InboxIcon }
