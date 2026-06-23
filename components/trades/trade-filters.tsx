'use client'

import { useRouter, useSearchParams } from 'next/navigation'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function TradeFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/trading/trade-log?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="space-y-2">
        <Label htmlFor="filter-outcome">Uitkomst</Label>
        <Select
          value={searchParams.get('outcome') ?? 'all'}
          onValueChange={(value) => setParam('outcome', value === 'all' ? null : value)}
        >
          <SelectTrigger id="filter-outcome" className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alles</SelectItem>
            <SelectItem value="win">Win</SelectItem>
            <SelectItem value="loss">Loss</SelectItem>
            <SelectItem value="breakeven">Break-even</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="filter-direction">Richting</Label>
        <Select
          value={searchParams.get('direction') ?? 'all'}
          onValueChange={(value) => setParam('direction', value === 'all' ? null : value)}
        >
          <SelectTrigger id="filter-direction" className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alles</SelectItem>
            <SelectItem value="long">Long</SelectItem>
            <SelectItem value="short">Short</SelectItem>
          </SelectContent>
        </Select>
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
