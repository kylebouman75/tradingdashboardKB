'use client'

import { useRouter, useSearchParams } from 'next/navigation'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function BacktestFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/research/backtest?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="space-y-2">
        <Label htmlFor="filter-symbol">Symbol</Label>
        <Input
          id="filter-symbol"
          className="w-[160px]"
          defaultValue={searchParams.get('symbol') ?? ''}
          placeholder="bijv. ES"
          onChange={(e) => setParam('symbol', e.target.value || null)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="filter-date-from">Datum van</Label>
        <Input
          id="filter-date-from"
          type="date"
          className="w-[160px]"
          defaultValue={searchParams.get('dateFrom') ?? ''}
          onChange={(e) => setParam('dateFrom', e.target.value || null)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="filter-date-to">Datum tot</Label>
        <Input
          id="filter-date-to"
          type="date"
          className="w-[160px]"
          defaultValue={searchParams.get('dateTo') ?? ''}
          onChange={(e) => setParam('dateTo', e.target.value || null)}
        />
      </div>
    </div>
  )
}
