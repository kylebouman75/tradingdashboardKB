'use client'

import { cn } from '@/lib/utils'

export function WeekFeelingsSelector({
  options,
  selectedValues,
  onChange,
}: {
  options: string[]
  selectedValues: string[]
  onChange: (values: string[]) => void
}) {
  function toggle(value: string) {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value))
    } else {
      onChange([...selectedValues, value])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = selectedValues.includes(option)
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm transition-colors',
              selected
                ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                : 'border-input hover:bg-accent'
            )}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}
