import { notFound } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { getTradeById } from '@/lib/trades'
import { TradeForm } from '@/components/trades/trade-form'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function EditTradePage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const trade = await getTradeById(supabase, params.id)

  if (!trade) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Trade bewerken</h1>
      <TradeForm trade={trade} />
    </div>
  )
}
