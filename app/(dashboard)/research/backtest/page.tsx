import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { getBacktests, type BacktestFilters } from '@/lib/backtest'
import { getStrategies } from '@/lib/strategies'
import { Button } from '@/components/ui/button'
import { BacktestTable } from '@/components/backtest/backtest-table'
import { BacktestFilters as BacktestFiltersBar } from '@/components/backtest/backtest-filters'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function BacktestPage({
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

  const filters: BacktestFilters = {
    symbol: searchParams.symbol,
    dateFrom: searchParams.dateFrom,
    dateTo: searchParams.dateTo,
    sortBy: (searchParams.sortBy as BacktestFilters['sortBy']) ?? 'date',
    sortDirection: (searchParams.sortDirection as BacktestFilters['sortDirection']) ?? 'desc',
  }

  const [backtests, strategies] = await Promise.all([
    getBacktests(supabase, user.id, filters),
    getStrategies(supabase, user.id),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Backtest</h1>
        <Button asChild size="lg">
          <Link href="/research/backtest/new">
            <Plus className="mr-2 h-4 w-4" />
            Nieuwe backtest
          </Link>
        </Button>
      </div>

      <BacktestFiltersBar />

      <BacktestTable backtests={backtests} strategies={strategies} />
    </div>
  )
}
