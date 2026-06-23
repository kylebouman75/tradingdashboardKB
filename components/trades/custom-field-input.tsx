'use client'

import { Star } from 'lucide-react'

import type { CustomFieldDefinition } from '@/lib/trades'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

function getOptions(definition: CustomFieldDefinition): string[] {
  return Array.isArray(definition.options)
    ? definition.options.filter((option): option is string => typeof option === 'string')
    : []
}

export function CustomFieldInput({
  definition,
  value,
  onChange,
}: {
  definition: CustomFieldDefinition
  value: unknown
  onChange: (value: unknown) => void
}) {
  switch (definition.type) {
    case 'text':
      return (
        <Input
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )

    case 'textarea':
      return (
        <Textarea
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
        />
      )

    case 'number':
      return (
        <Input
          type="number"
          value={typeof value === 'number' ? value : ''}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        />
      )

    case 'date':
      return (
        <Input
          type="date"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )

    case 'time':
      return (
        <Input
          type="time"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )

    case 'boolean':
      return (
        <ToggleGroup
          type="single"
          variant="outline"
          value={value === true ? 'yes' : value === false ? 'no' : undefined}
          onValueChange={(next) => {
            if (next) onChange(next === 'yes')
          }}
        >
          <ToggleGroupItem value="yes">Ja</ToggleGroupItem>
          <ToggleGroupItem value="no">Nee</ToggleGroupItem>
        </ToggleGroup>
      )

    case 'rating': {
      const current = typeof value === 'number' ? value : 0
      return (
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => onChange(rating)}
              aria-label={`${rating} van 5`}
            >
              <Star
                className={cn(
                  'h-5 w-5',
                  rating <= current
                    ? 'fill-blue-400 text-blue-400'
                    : 'text-muted-foreground'
                )}
              />
            </button>
          ))}
        </div>
      )
    }

    case 'dropdown': {
      const options = getOptions(definition)
      return (
        <Select
          value={typeof value === 'string' ? value : undefined}
          onValueChange={(next) => onChange(next)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecteer..." />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    case 'multiselect': {
      const options = getOptions(definition)
      const selected = Array.isArray(value)
        ? value.filter((v): v is string => typeof v === 'string')
        : []

      function toggle(option: string) {
        if (selected.includes(option)) {
          onChange(selected.filter((item) => item !== option))
        } else {
          onChange([...selected, option])
        }
      }

      return (
        <div className="flex flex-wrap gap-3">
          {options.map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => toggle(option)}
                className="h-4 w-4 rounded border-input"
              />
              {option}
            </label>
          ))}
        </div>
      )
    }

    default:
      return null
  }
}
