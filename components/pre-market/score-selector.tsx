'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

export function ScoreSelector({
  value,
  onChange,
  labels,
  descriptions,
}: {
  value: number | null
  onChange: (value: number) => void
  labels: Record<number, string>
  descriptions: Record<number, string>
}) {
  const [hovered, setHovered] = React.useState<number | null>(null)
  const shown = hovered ?? value

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score)}
            onMouseEnter={() => setHovered(score)}
            onMouseLeave={() => setHovered(null)}
            className={cn(
              'flex flex-col items-center gap-1 rounded-md border px-2 py-3 text-sm transition-colors',
              value === score
                ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                : 'border-input hover:bg-accent'
            )}
          >
            <span className="text-lg font-semibold">{score}</span>
            <span className="text-xs text-muted-foreground">{labels[score]}</span>
          </button>
        ))}
      </div>
      {shown !== null && <p className="text-sm text-muted-foreground">{descriptions[shown]}</p>}
    </div>
  )
}
