'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'
import { getStrategyById, type Strategy } from '@/lib/strategies'
import { StrategyForm } from '@/components/strategies/strategy-form'

export default function EditStrategyPage() {
  const params = useParams()
  const supabase = React.useMemo(() => createClient(), [])
  const [strategy, setStrategy] = React.useState<Strategy | null>(null)
  const [loading, setLoading] = React.useState(true)

  const id = Array.isArray(params.id) ? params.id[0] : (params.id as string)

  React.useEffect(() => {
    async function load() {
      const data = await getStrategyById(supabase, id)
      setStrategy(data)
      setLoading(false)
    }
    load()
  }, [supabase, id])

  if (loading) {
    return <p className="text-sm text-muted-foreground">Laden...</p>
  }

  if (!strategy) {
    return <p className="text-sm text-muted-foreground">Strategie niet gevonden.</p>
  }

  return <StrategyForm strategy={strategy} />
}
