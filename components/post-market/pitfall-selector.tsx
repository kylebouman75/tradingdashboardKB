'use client'

import type { Pitfall } from '@/lib/post-market'
import { cn } from '@/lib/utils'

export function PitfallSelector({
  pitfalls,
  selectedIds,
  onChange,
}: {
  pitfalls: Pitfall[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}) {
  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  if (pitfalls.length === 0) {
    return <p className="text-sm text-muted-foreground">Geen valkuilen beschikbaar.</p>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {pitfalls.map((pitfall) => {
        const selected = selectedIds.includes(pitfall.id)
        return (
          <button
            key={pitfall.id}
            type="button"
            onClick={() => toggle(pitfall.id)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm transition-colors',
              selected
                ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                : 'border-input hover:bg-accent'
            )}
          >
            {pitfall.name}
          </button>
        )
      })}
    </div>
  )
}
