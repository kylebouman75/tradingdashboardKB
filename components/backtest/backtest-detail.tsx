import Link from 'next/link'
import { Pencil } from 'lucide-react'

import type { Backtest } from '@/lib/backtest'
import type { Strategy } from '@/lib/strategies'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DeleteBacktestDialog } from '@/components/backtest/delete-backtest-dialog'
import { BacktestScreenshotSection } from '@/components/backtest/backtest-screenshot-section'

function formatDate(date: string) {
  const [year, month, day] = date.split('-')
  return `${day}-${month}-${year}`
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent className="whitespace-pre-wrap text-sm">{value || '—'}</CardContent>
    </Card>
  )
}

export function BacktestDetail({
  backtest,
  strategy,
}: {
  backtest: Backtest
  strategy: Strategy | null
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{backtest.symbol}</h1>
            <span className="text-muted-foreground">{formatDate(backtest.date)}</span>
          </div>
          {backtest.rr !== null && (
            <p className="text-3xl font-semibold text-foreground">RR {backtest.rr}</p>
          )}
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/research/backtest/${backtest.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Bewerken
            </Link>
          </Button>
          <DeleteBacktestDialog backtestId={backtest.id} redirectAfterDelete />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Strategie</CardTitle>
        </CardHeader>
        <CardContent>{strategy?.name ?? '—'}</CardContent>
      </Card>

      <Field label="Hypothese" value={backtest.hypothesis} />
      <Field label="Marktcontext" value={backtest.market_context} />
      <Field label="Setup omschrijving" value={backtest.setup_description} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Entry criteria" value={backtest.entry_criteria} />
        <Field label="Exit criteria" value={backtest.exit_criteria} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Wat werkte" value={backtest.what_worked} />
        <Field label="Wat werkte niet" value={backtest.what_didnt} />
      </div>

      <Field label="Observaties" value={backtest.observations} />
      <Field label="Conclusie" value={backtest.conclusion} />

      <BacktestScreenshotSection backtestId={backtest.id} allowUpload={false} />
    </div>
  )
}
