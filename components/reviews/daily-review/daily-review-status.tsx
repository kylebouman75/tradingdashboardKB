import { Badge } from '@/components/ui/badge'

export type DailyReviewUiStatus = 'not_generated' | 'draft' | 'approved'

const STATUS_CONFIG: Record<DailyReviewUiStatus, { label: string; className: string }> = {
  not_generated: {
    label: 'Nog niet gegenereerd',
    className: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  },
  draft: {
    label: 'Draft',
    className: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  approved: {
    label: 'Goedgekeurd',
    className: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
}

export function DailyReviewStatus({ status }: { status: DailyReviewUiStatus }) {
  const config = STATUS_CONFIG[status]

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}
