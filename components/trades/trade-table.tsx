'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowUpDown, Eye, Pencil, Trash2 } from 'lucide-react'

import type { Emotion, Trade, TradingSession } from '@/lib/trades'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DeleteTradeDialog } from '@/components/trades/delete-trade-dialog'

const OUTCOME_LABEL: Record<Trade['outcome'], string> = {
  win: 'Win',
  loss: 'Loss',
  breakeven: 'BE',
}

const OUTCOME_BADGE: Record<Trade['outcome'], string> = {
  win: 'bg-green-500/20 text-green-400 border-green-500/30',
  loss: 'bg-red-500/20 text-red-400 border-red-500/30',
  breakeven: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

const DIRECTION_LABEL: Record<Trade['direction'], string> = {
  long: 'Long',
  short: 'Short',
}

const DIRECTION_BADGE: Record<Trade['direction'], string> = {
  long: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  short: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
}

function formatDate(date: string) {
  const [year, month, day] = date.split('-')
  return `${day}-${month}-${year}`
}

function formatTime(time: string | null) {
  return time ? time.slice(0, 5) : '—'
}

export function TradeTable({
  trades,
  sessions,
  emotions,
}: {
  trades: Trade[]
  sessions: TradingSession[]
  emotions: Emotion[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const sessionMap = new Map(sessions.map((s) => [s.id, s.name]))
  const emotionMap = new Map(emotions.map((e) => [e.id, e.name]))

  function setSort(column: string) {
    const params = new URLSearchParams(searchParams.toString())
    const currentSort = params.get('sortBy')
    const currentDir = params.get('sortDirection') ?? 'desc'

    params.set('sortBy', column)
    params.set('sortDirection', currentSort === column && currentDir === 'desc' ? 'asc' : 'desc')

    router.push(`/trading/trade-log?${params.toString()}`)
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

  if (trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed py-16 text-center">
        <p className="text-muted-foreground">Nog geen trades gelogd</p>
        <Button asChild>
          <Link href="/trading/trade-log/new">Eerste trade toevoegen</Link>
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
            <TableHead>Tijd</TableHead>
            <SortableHead column="symbol" label="Symbol" />
            <TableHead>Sessie</TableHead>
            <TableHead>Richting</TableHead>
            <SortableHead column="outcome" label="Uitkomst" />
            <SortableHead column="rr" label="RR" />
            <TableHead>Emotie</TableHead>
            <TableHead className="text-right">Acties</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trades.map((trade) => (
            <TableRow key={trade.id}>
              <TableCell>{formatDate(trade.date)}</TableCell>
              <TableCell>{formatTime(trade.time)}</TableCell>
              <TableCell className="font-medium">{trade.symbol}</TableCell>
              <TableCell>
                {trade.session_id ? sessionMap.get(trade.session_id) ?? '—' : '—'}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={DIRECTION_BADGE[trade.direction]}>
                  {DIRECTION_LABEL[trade.direction]}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={OUTCOME_BADGE[trade.outcome]}>
                  {OUTCOME_LABEL[trade.outcome]}
                </Badge>
              </TableCell>
              <TableCell>{trade.rr ?? '—'}</TableCell>
              <TableCell>
                {trade.emotion_id ? emotionMap.get(trade.emotion_id) ?? '—' : '—'}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button asChild variant="ghost" size="icon">
                    <Link href={`/trading/trade-log/${trade.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" size="icon">
                    <Link href={`/trading/trade-log/${trade.id}/edit`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <DeleteTradeDialog
                    tradeId={trade.id}
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
