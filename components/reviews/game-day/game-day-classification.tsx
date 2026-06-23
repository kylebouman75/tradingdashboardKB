import type { GameDayClassificationValue } from '@/lib/game-day'
import { cn } from '@/lib/utils'

const CONFIG: Record<GameDayClassificationValue, { label: string; className: string }> = {
  A: {
    label: '🟢 A-Game dag',
    className: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
  B: {
    label: '🟡 B-Game dag',
    className: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  C: {
    label: '🔴 C-Game dag',
    className: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
  'B→A': {
    label: '🟡➡️🟢 B→A dag',
    className: 'bg-gradient-to-r from-amber-500/20 to-green-500/20 text-green-400 border-green-500/30',
  },
  'A→B': {
    label: '🟢➡️🟡 A→B dag',
    className: 'bg-gradient-to-r from-green-500/20 to-amber-500/20 text-amber-400 border-amber-500/30',
  },
  'B→C': {
    label: '🟡➡️🔴 B→C dag',
    className: 'bg-gradient-to-r from-amber-500/20 to-red-500/20 text-red-400 border-red-500/30',
  },
}

export function GameDayClassification({
  classification,
}: {
  classification: GameDayClassificationValue
}) {
  const config = CONFIG[classification]

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg border px-5 py-3 text-lg font-semibold',
        config.className
      )}
    >
      {config.label}
    </div>
  )
}
