'use client'

import * as React from 'react'
import Link from 'next/link'
import { Plus, BookOpen } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { getStrategies, type Strategy } from '@/lib/strategies'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function StrategyLibraryPage() {
  const supabase = React.useMemo(() => createClient(), [])
  const [strategies, setStrategies] = React.useState<Strategy[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const data = await getStrategies(supabase, user.id)
      setStrategies(data)
      setLoading(false)
    }
    load()
  }, [supabase])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Strategy Library</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Documenteer en beheer je trading strategieën
          </p>
        </div>
        <Button asChild>
          <Link href="/libraries/strategy-library/new">
            <Plus className="mr-2 h-4 w-4" />
            Nieuwe strategie
          </Link>
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Laden...</p>
      ) : strategies.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {strategies.map((strategy) => (
            <StrategyCard key={strategy.id} strategy={strategy} />
          ))}
        </div>
      )}
    </div>
  )
}

function StrategyCard({ strategy }: { strategy: Strategy }) {
  const filledSections = [
    strategy.setup_conditions,
    strategy.entry_criteria,
    strategy.exit_criteria,
    strategy.trade_management_rules,
    strategy.a_plus_criteria,
  ].filter(Boolean).length

  return (
    <Link href={`/libraries/strategy-library/${strategy.id}`}>
      <Card className="h-full transition-colors hover:bg-accent/50">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg">{strategy.name}</CardTitle>
            <Badge variant="secondary" className="shrink-0">
              {filledSections}/5 secties
            </Badge>
          </div>
          {strategy.description && (
            <CardDescription className="line-clamp-2">{strategy.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Aangemaakt{' '}
            {new Date(strategy.created_at).toLocaleDateString('nl-NL', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
      <BookOpen className="mb-4 h-12 w-12 text-muted-foreground/50" />
      <h3 className="mb-2 text-lg font-semibold">Nog geen strategieën</h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">
        Documenteer je trading strategieën zodat je ze kunt verfijnen en koppelen aan je trades.
      </p>
      <Button asChild>
        <Link href="/libraries/strategy-library/new">
          <Plus className="mr-2 h-4 w-4" />
          Eerste strategie aanmaken
        </Link>
      </Button>
    </div>
  )
}
