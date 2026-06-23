import { notFound, redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { getCustomFieldDefinitions, getTradeById } from '@/lib/trades'
import { TradeDetail } from '@/components/trades/trade-detail'

// Forceer een verse server-fetch op elke request, zodat een net verwijderde
// custom_field_definition nooit via een gecachte response blijft hangen.
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function TradeDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const trade = await getTradeById(supabase, params.id)

  if (!trade) {
    notFound()
  }

  const [sessionResult, emotionResult, customFields] = await Promise.all([
    trade.session_id
      ? supabase.from('trading_sessions').select('*').eq('id', trade.session_id).maybeSingle()
      : Promise.resolve({ data: null }),
    trade.emotion_id
      ? supabase.from('emotions').select('*').eq('id', trade.emotion_id).maybeSingle()
      : Promise.resolve({ data: null }),
    getCustomFieldDefinitions(supabase, user.id),
  ])

  return (
    <TradeDetail
      trade={trade}
      session={sessionResult.data}
      emotion={emotionResult.data}
      customFields={customFields}
    />
  )
}
