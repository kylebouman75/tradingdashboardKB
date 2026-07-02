import { notFound } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { getBacktestById } from '@/lib/backtest'
import { BacktestForm } from '@/components/backtest/backtest-form'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function EditBacktestPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const backtest = await getBacktestById(supabase, params.id)

  if (!backtest) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Backtest bewerken</h1>
      <BacktestForm backtest={backtest} />
    </div>
  )
}
