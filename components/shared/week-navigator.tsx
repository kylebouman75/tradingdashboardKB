'use client'

import { usePathname, useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { formatWeekRangeNL, shiftWeek } from '@/lib/week'
import { Button } from '@/components/ui/button'

export function WeekNavigator({ weekStartDate }: { weekStartDate: string }) {
  const router = useRouter()
  const pathname = usePathname()

  function goTo(newWeekStart: string) {
    router.push(`${pathname}?week=${newWeekStart}`)
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => goTo(shiftWeek(weekStartDate, -1))}
        aria-label="Vorige week"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <span className="block min-w-[260px] rounded-md border px-4 py-2 text-center text-sm font-medium">
        {formatWeekRangeNL(weekStartDate)}
      </span>

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => goTo(shiftWeek(weekStartDate, 1))}
        aria-label="Volgende week"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
