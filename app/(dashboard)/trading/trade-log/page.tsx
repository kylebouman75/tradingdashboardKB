import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, Settings } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { getEmotions, getTrades, getTradingSessions, type TradeFilters } from '@/lib/trades'
import { Button } from '@/components/ui/button'
import { TradeTable } from '@/components/trades/trade-table'
import { TradeFilters as TradeFiltersBar } from '@/components/trades/trade-filters'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function TradeLogPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const filters: TradeFilters = {
    outcome: searchParams.outcome as TradeFilters['outcome'],
    direction: searchParams.direction as TradeFilters['direction'],
    dateFrom: searchParams.dateFrom,
    dateTo: searchParams.dateTo,
    sortBy: (searchParams.sortBy as TradeFilters['sortBy']) ?? 'date',
    sortDirection: (searchParams.sortDirection as TradeFilters['sortDirection']) ?? 'desc',
  }

  const [trades, sessions, emotions] = await Promise.all([
    getTrades(supabase, user.id, filters),
    getTradingSessions(supabase, user.id),
    getEmotions(supabase, user.id),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Trade Log</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/trading/trade-log/custom-fields">
              <Settings className="mr-2 h-4 w-4" />
              Eigen velden
            </Link>
          </Button>
          <Button asChild size="lg">
            <Link href="/trading/trade-log/new">
              <Plus className="mr-2 h-4 w-4" />
              Nieuwe trade
            </Link>
          </Button>
        </div>
      </div>

      <TradeFiltersBar />

      <TradeTable trades={trades} sessions={sessions} emotions={emotions} />
    </div>
  )
}
