import { Link } from 'react-router-dom'
import { ArrowRight, LucideIcon } from 'lucide-react'

interface Props {
  label: string
  value: string | number
  icon: LucideIcon
  color: string
  link?: string
}

// Polaris analytics metric card
export default function StatCard({ label, value, icon: Icon, color, link }: Props) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <div className={`rounded-lg p-1.5 ${color}`}>
          <Icon size={16} />
        </div>
      </div>
      <div className="mt-2 flex items-end justify-between">
        <p className="text-2xl font-bold tracking-tight text-gray-900">{value}</p>
        {link && (
          <ArrowRight
            size={16}
            className="mb-1 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-600"
          />
        )}
      </div>
    </>
  )

  const cls = 'p-card group block p-4 transition hover:bg-gray-50'

  if (link) {
    return (
      <Link to={link} className={cls}>
        {body}
      </Link>
    )
  }
  return <div className={cls}>{body}</div>
}
