'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Pencil, Trash2, ArrowLeft } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { deleteStrategy, getStrategyById, type Strategy } from '@/lib/strategies'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { StrategyImageSection } from '@/components/strategies/strategy-image-section'
import { StrategyPerformanceSection } from '@/components/strategies/strategy-performance-section'

export default function StrategyDetailPage() {
  const params = useParams()
  const router = useRouter()
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

  async function handleDelete() {
    await deleteStrategy(supabase, id)
    router.push('/libraries/strategy-library')
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Laden...</p>
  }

  if (!strategy) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Strategie niet gevonden.</p>
        <Button variant="outline" asChild>
          <Link href="/libraries/strategy-library">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Terug naar overzicht
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/libraries/strategy-library">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{strategy.name}</h1>
            {strategy.description && (
              <p className="mt-1 text-sm text-muted-foreground">{strategy.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/libraries/strategy-library/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Bewerken
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Trash2 className="h-4 w-4 text-red-400" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Strategie verwijderen</AlertDialogTitle>
                <AlertDialogDescription>
                  Weet je zeker dat je &ldquo;{strategy.name}&rdquo; wilt verwijderen? Dit kan niet
                  ongedaan worden gemaakt.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuleren</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Verwijderen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {strategy.explanation && (
        <Section title="Uitleg" content={strategy.explanation} />
      )}
      {strategy.setup_conditions && (
        <Section title="Setup voorwaarden" content={strategy.setup_conditions} />
      )}
      {strategy.entry_criteria && (
        <Section title="Entry criteria" content={strategy.entry_criteria} />
      )}
      {strategy.exit_criteria && (
        <Section title="Exit criteria" content={strategy.exit_criteria} />
      )}
      {strategy.trade_management_rules && (
        <Section title="Trade management regels" content={strategy.trade_management_rules} />
      )}
      {strategy.a_plus_criteria && (
        <Section title="A+ criteria" content={strategy.a_plus_criteria} />
      )}

      <StrategyImageSection strategyId={id} editable={false} />

      <StrategyPerformanceSection strategyId={id} />
    </div>
  )
}

function Section({ title, content }: { title: string; content: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
      </CardContent>
    </Card>
  )
}
