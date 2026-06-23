'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { getTrades } from '@/lib/trades'
import {
  approveMonthlyReview,
  createMonthlyReview,
  getMonthlyReview,
  toText,
  updateMonthlyReviewContent,
  type MonthlyReview,
} from '@/lib/monthly-review'
import { getMonthlyReflection } from '@/lib/monthly-reflection'
import { getMonthDateRange } from '@/lib/month'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DailyReviewStatus, type DailyReviewUiStatus } from '@/components/reviews/daily-review/daily-review-status'
import { MonthlyReviewOutput } from '@/components/reviews/monthly-review/monthly-review-output'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

type Summary = {
  tradeCount: number
  tradingDayCount: number
  approvedWeeklyReviewCount: number
  hasReflection: boolean
}

export function MonthlyReviewPage({ monthYear }: { monthYear: string }) {
  const supabase = React.useMemo(() => createClient(), [])

  const [userId, setUserId] = React.useState<string | null>(null)
  const [review, setReview] = React.useState<MonthlyReview | null>(null)
  const [summary, setSummary] = React.useState<Summary | null>(null)
  const [outputText, setOutputText] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(true)
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [generateError, setGenerateError] = React.useState<string | null>(null)
  const [isApproving, setIsApproving] = React.useState(false)
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>('idle')

  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>()
  const skipNextSave = React.useRef(true)
  const hasInitialized = React.useRef(false)

  React.useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)

      const { from: monthFrom, to: monthTo } = getMonthDateRange(monthYear)

      const [existingReview, trades, reflection, weeklyReviewRows] = await Promise.all([
        getMonthlyReview(supabase, user.id, monthYear),
        getTrades(supabase, user.id, { dateFrom: monthFrom, dateTo: monthTo }),
        getMonthlyReflection(supabase, user.id, monthYear),
        supabase
          .from('weekly_reviews')
          .select('id')
          .eq('user_id', user.id)
          .gte('week_start_date', monthFrom)
          .lte('week_start_date', monthTo)
          .eq('status', 'approved'),
      ])

      const tradingDayCount = new Set(trades.map((t) => t.date)).size

      setReview(existingReview)
      setOutputText(toText(existingReview?.approved_content ?? existingReview?.generated_content ?? null))
      setSummary({
        tradeCount: trades.length,
        tradingDayCount,
        approvedWeeklyReviewCount: weeklyReviewRows.data?.length ?? 0,
        hasReflection: Boolean(reflection),
      })
      setIsLoading(false)
    }

    load()
  }, [supabase, monthYear])

  React.useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false
      return
    }

    if (!review || review.status !== 'draft') return

    setSaveStatus('saving')

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      try {
        await updateMonthlyReviewContent(supabase, review.id, outputText)
        setSaveStatus('saved')
      } catch {
        setSaveStatus('error')
      }
    }, 1000)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outputText])

  async function handleGenerate() {
    if (!userId) return

    setIsGenerating(true)
    setGenerateError(null)

    try {
      const response = await fetch('/api/engines/monthly-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthYear }),
      })

      const body = await response.json()

      if (!response.ok) {
        throw new Error(body?.error ?? 'Genereren is mislukt.')
      }

      const created = await createMonthlyReview(supabase, userId, monthYear, body.content as string)
      skipNextSave.current = true
      setReview(created)
      setOutputText(toText(created.approved_content ?? created.generated_content))
    } catch (error) {
      setGenerateError(error instanceof Error ? error.message : 'Genereren is mislukt.')
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleApprove() {
    if (!review) return

    setIsApproving(true)
    try {
      const approved = await approveMonthlyReview(supabase, review.id, outputText)
      setReview(approved)
    } finally {
      setIsApproving(false)
    }
  }

  if (isLoading || !summary) {
    return <p className="text-sm text-muted-foreground">Laden...</p>
  }

  const uiStatus: DailyReviewUiStatus = !review
    ? 'not_generated'
    : review.status === 'draft'
      ? 'draft'
      : 'approved'

  return (
    <div className="space-y-6">
      <DailyReviewStatus status={uiStatus} />

      <Card>
        <CardContent className="flex flex-wrap gap-6 pt-6 text-sm">
          <span>{summary.tradingDayCount} tradingdag{summary.tradingDayCount !== 1 ? 'en' : ''}</span>
          <span>{summary.tradeCount} trade{summary.tradeCount !== 1 ? 's' : ''}</span>
          <span>
            {summary.approvedWeeklyReviewCount > 0
              ? `${summary.approvedWeeklyReviewCount} Weekly Review${summary.approvedWeeklyReviewCount !== 1 ? 's' : ''} goedgekeurd`
              : 'Geen goedgekeurde Weekly Reviews'}
          </span>
          <span>{summary.hasReflection ? '✅' : '❌'} Monthly Reflectie</span>
        </CardContent>
      </Card>

      {summary.tradeCount === 0 && (
        <p className="text-sm text-amber-400">Onvoldoende data — log eerst trades deze maand.</p>
      )}

      {uiStatus === 'not_generated' && (
        <div className="space-y-2">
          <Button onClick={handleGenerate} disabled={isGenerating || summary.tradeCount === 0}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Monthly Review wordt gegenereerd...
              </>
            ) : (
              'Monthly Review genereren'
            )}
          </Button>
          {generateError && (
            <p className="text-sm text-red-400">
              {generateError}{' '}
              <button type="button" onClick={handleGenerate} className="underline">
                Opnieuw proberen
              </button>
            </p>
          )}
        </div>
      )}

      {review && (
        <div className="space-y-4">
          <MonthlyReviewOutput
            value={outputText}
            onChange={setOutputText}
            readOnly={review.status !== 'draft'}
          />

          {review.status === 'draft' && (
            <div className="flex items-center justify-between rounded-md border bg-muted/30 px-4 py-3">
              <span className="text-sm text-muted-foreground">
                {saveStatus === 'saving' && 'Opslaan...'}
                {saveStatus === 'saved' && 'Opgeslagen'}
                {saveStatus === 'error' && 'Fout bij opslaan'}
                {saveStatus === 'idle' && 'Wijzigingen worden automatisch opgeslagen.'}
              </span>
              <Button onClick={handleApprove} disabled={isApproving}>
                {isApproving ? 'Bezig...' : 'Monthly Review goedkeuren'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
