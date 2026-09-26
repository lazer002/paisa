import { Link } from 'react-router-dom'
import { ArrowRight, LucideIcon } from 'lucide-react'

interface Props {
  label: string
  value: string | number
  icon: LucideIcon
  color: string
  link?: string
}

export default function StatCard({ label, value, icon: Icon, color, link }: Props) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <div className={`rounded-xl p-3 ${color}`}>
          <Icon size={20} />
        </div>
        {link && (
          <ArrowRight
            size={16}
            className="text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-500"
          />
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </>
  )

  const cls =
    'group rounded-2xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md'

  if (link) {
    return (
      <Link to={link} className={cls}>
        {body}
      </Link>
    )
  }
  return <div className={cls}>{body}</div>
}
