import { notFound, redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { getBacktestById } from '@/lib/backtest'
import { BacktestDetail } from '@/components/backtest/backtest-detail'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function BacktestDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const backtest = await getBacktestById(supabase, params.id)

  if (!backtest) {
    notFound()
  }

  const strategyResult = backtest.strategy_id
    ? await supabase.from('strategies').select('*').eq('id', backtest.strategy_id).maybeSingle()
    : { data: null }

  return <BacktestDetail backtest={backtest} strategy={strategyResult.data} />
}
