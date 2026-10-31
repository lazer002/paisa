import Badge from '@/components/ui/badge'
import { STAGE_META } from './stageMeta'

export function StageBadge({ stage }: { stage: string | null | undefined }) {
  const meta = STAGE_META[stage ?? 'none'] ?? { label: String(stage), color: 'gray' as const }
  return <Badge color={meta.color}>{meta.label}</Badge>
}

export default StageBadge
