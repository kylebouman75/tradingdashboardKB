'use client'

import { usePathname, useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'

function formatDateNL(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00`)
  return new Intl.DateTimeFormat('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function shiftDate(dateStr: string, days: number) {
  const date = new Date(`${dateStr}T00:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export function DateNavigator({ date }: { date: string }) {
  const router = useRouter()
  const pathname = usePathname()

  function goTo(newDate: string) {
    router.push(`${pathname}?date=${newDate}`)
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => goTo(shiftDate(date, -1))}
        aria-label="Vorige dag"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="relative">
        <span className="block min-w-[220px] rounded-md border px-4 py-2 text-center text-sm font-medium">
          {formatDateNL(date)}
        </span>
        <input
          type="date"
          value={date}
          onChange={(e) => e.target.value && goTo(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label="Datum kiezen"
        />
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => goTo(shiftDate(date, 1))}
        aria-label="Volgende dag"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
