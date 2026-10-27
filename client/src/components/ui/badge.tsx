import { ReactNode } from 'react'

type BadgeColor = 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'gray' | 'orange'

interface BadgeProps {
  children: ReactNode
  color?: BadgeColor
}

// Polaris badge tones: success, critical, warning, info, magic, neutral, attention
const colors: Record<BadgeColor, string> = {
  green: 'bg-[#affebf] text-[#014b40]',
  red: 'bg-[#fedad9] text-[#8e0b21]',
  yellow: 'bg-[#ffef9d] text-[#4f4700]',
  blue: 'bg-[#e0f0ff] text-[#00527c]',
  purple: 'bg-[#f1ecff] text-[#5700d1]',
  gray: 'bg-[#e3e3e3] text-[#616161]',
  orange: 'bg-[#ffd6a4] text-[#5e4200]',
}

export type { BadgeColor }

export default function Badge({ children, color = 'gray' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium capitalize ${colors[color]}`}
    >
      {children}
    </span>
  )
}
