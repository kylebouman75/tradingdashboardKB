'use client'

import { usePathname, useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { formatMonthYearNL, shiftMonth } from '@/lib/month'
import { Button } from '@/components/ui/button'

export function MonthNavigator({ monthYear }: { monthYear: string }) {
  const router = useRouter()
  const pathname = usePathname()

  function goTo(newMonthYear: string) {
    router.push(`${pathname}?month=${newMonthYear}`)
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => goTo(shiftMonth(monthYear, -1))}
        aria-label="Vorige maand"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <span className="block min-w-[200px] rounded-md border px-4 py-2 text-center text-sm font-medium capitalize">
        {formatMonthYearNL(monthYear)}
      </span>

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => goTo(shiftMonth(monthYear, 1))}
        aria-label="Volgende maand"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
