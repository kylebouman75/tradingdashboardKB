'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowUpDown, Eye, Pencil, Trash2 } from 'lucide-react'

import type { Backtest } from '@/lib/backtest'
import type { Strategy } from '@/lib/strategies'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DeleteBacktestDialog } from '@/components/backtest/delete-backtest-dialog'

function formatDate(date: string) {
  const [year, month, day] = date.split('-')
  return `${day}-${month}-${year}`
}

export function BacktestTable({
  backtests,
  strategies,
}: {
  backtests: Backtest[]
  strategies: Strategy[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const strategyMap = new Map(strategies.map((s) => [s.id, s.name]))

  function setSort(column: string) {
    const params = new URLSearchParams(searchParams.toString())
    const currentSort = params.get('sortBy')
    const currentDir = params.get('sortDirection') ?? 'desc'

    params.set('sortBy', column)
    params.set('sortDirection', currentSort === column && currentDir === 'desc' ? 'asc' : 'desc')

    router.push(`/research/backtest?${params.toString()}`)
  }

  function SortableHead({ column, label }: { column: string; label: string }) {
    return (
      <TableHead>
        <button
          type="button"
          onClick={() => setSort(column)}
          className="flex items-center gap-1 hover:text-foreground"
        >
          {label}
          <ArrowUpDown className="h-3 w-3" />
        </button>
      </TableHead>
    )
  }

  if (backtests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed py-16 text-center">
        <p className="text-muted-foreground">Nog geen backtests gelogd</p>
        <Button asChild>
          <Link href="/research/backtest/new">Eerste backtest toevoegen</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHead column="date" label="Datum" />
            <SortableHead column="symbol" label="Symbol" />
            <TableHead>Strategie</TableHead>
            <SortableHead column="rr" label="RR" />
            <TableHead className="text-right">Acties</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {backtests.map((backtest) => (
            <TableRow key={backtest.id}>
              <TableCell>{formatDate(backtest.date)}</TableCell>
              <TableCell className="font-medium">{backtest.symbol}</TableCell>
              <TableCell>
                {backtest.strategy_id ? strategyMap.get(backtest.strategy_id) ?? '—' : '—'}
              </TableCell>
              <TableCell>{backtest.rr ?? '—'}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button asChild variant="ghost" size="icon">
                    <Link href={`/research/backtest/${backtest.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" size="icon">
                    <Link href={`/research/backtest/${backtest.id}/edit`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <DeleteBacktestDialog
                    backtestId={backtest.id}
                    trigger={
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    }
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
