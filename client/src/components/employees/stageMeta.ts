import type { BadgeColor } from '@/components/ui/badge'

export const STAGE_META: Record<string, { label: string; color: BadgeColor }> = {
  none: { label: 'Not set', color: 'gray' },
  inactive: { label: 'Inactive', color: 'gray' },
  onboarding: { label: 'Onboarding', color: 'blue' },
  probation: { label: 'Probation', color: 'purple' },
  active: { label: 'Active', color: 'green' },
  on_leave: { label: 'On leave', color: 'yellow' },
  suspended: { label: 'Suspended', color: 'red' },
  notice_period: { label: 'Notice period', color: 'orange' },
  exited: { label: 'Exited', color: 'gray' },
}

export function stageLabel(stage: string | null | undefined): string {
  return STAGE_META[stage ?? 'none']?.label ?? String(stage)
}
