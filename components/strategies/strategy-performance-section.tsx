'use client'

import * as React from 'react'

import { createClient } from '@/lib/supabase/client'
import type { Trade } from '@/lib/trades'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Stats = {
  total: number
  wins: number
  losses: number
  breakevens: number
  winRate: number
  avgRR: number | null
  longs: number
  shorts: number
}

function computeStats(trades: Trade[]): Stats {
  const total = trades.length
  const wins = trades.filter((t) => t.outcome === 'win').length
  const losses = trades.filter((t) => t.outcome === 'loss').length
  const breakevens = trades.filter((t) => t.outcome === 'breakeven').length
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0
  const rrs = trades.map((t) => t.rr).filter((r): r is number => r !== null)
  const avgRR = rrs.length > 0 ? Math.round((rrs.reduce((a, b) => a + b, 0) / rrs.length) * 100) / 100 : null
  const longs = trades.filter((t) => t.direction === 'long').length
  const shorts = trades.filter((t) => t.direction === 'short').length
  return { total, wins, losses, breakevens, winRate, avgRR, longs, shorts }
}

export function StrategyPerformanceSection({ strategyId }: { strategyId: string }) {
  const supabase = React.useMemo(() => createClient(), [])
  const [trades, setTrades] = React.useState<Trade[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('strategy_id', strategyId)
        .order('date', { ascending: false })

      if (!error) setTrades(data ?? [])
      setLoading(false)
    }
    load()
  }, [supabase, strategyId])

  const stats = computeStats(trades)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prestatieanalyse</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Laden...</p>
        ) : trades.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nog geen trades gekoppeld aan deze strategie.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatBox label="Trades" value={String(stats.total)} />
              <StatBox label="Win rate" value={`${stats.winRate}%`} />
              <StatBox label="Gem. RR" value={stats.avgRR !== null ? String(stats.avgRR) : '—'} />
              <StatBox label="Long / Short" value={`${stats.longs} / ${stats.shorts}`} />
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-green-400">
                {stats.wins} win{stats.wins !== 1 ? 's' : ''}
              </Badge>
              <Badge variant="secondary" className="text-red-400">
                {stats.losses} loss{stats.losses !== 1 ? 'es' : ''}
              </Badge>
              {stats.breakevens > 0 && (
                <Badge variant="secondary" className="text-muted-foreground">
                  {stats.breakevens} break-even
                </Badge>
              )}
            </div>

            <div className="space-y-1">
              {trades.slice(0, 10).map((trade) => (
                <div
                  key={trade.id}
                  className="flex items-center justify-between rounded-md px-3 py-1.5 text-sm even:bg-muted/30"
                >
                  <span className="text-muted-foreground">{trade.date}</span>
                  <span className="font-medium">{trade.symbol}</span>
                  <span className="capitalize text-muted-foreground">{trade.direction}</span>
                  <OutcomeBadge outcome={trade.outcome} />
                  <span className="text-muted-foreground">{trade.rr !== null ? `${trade.rr}R` : '—'}</span>
                </div>
              ))}
              {trades.length > 10 && (
                <p className="pt-1 text-center text-xs text-muted-foreground">
                  + {trades.length - 10} meer trades
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border px-3 py-2 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  )
}

function OutcomeBadge({ outcome }: { outcome: Trade['outcome'] }) {
  const map: Record<Trade['outcome'], { label: string; className: string }> = {
    win: { label: 'Win', className: 'text-green-400' },
    loss: { label: 'Loss', className: 'text-red-400' },
    breakeven: { label: 'B/E', className: 'text-muted-foreground' },
  }
  const { label, className } = map[outcome]
  return <span className={`text-xs font-medium ${className}`}>{label}</span>
}
