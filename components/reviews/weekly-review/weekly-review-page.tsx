'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { getTrades } from '@/lib/trades'
import {
  approveWeeklyReview,
  createWeeklyReview,
  getWeeklyReview,
  toText,
  updateWeeklyReviewContent,
  type WeeklyReview,
} from '@/lib/weekly-review'
import { getWeeklyReflection } from '@/lib/weekly-reflection'
import { getWeekEndIso } from '@/lib/week'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DailyReviewStatus, type DailyReviewUiStatus } from '@/components/reviews/daily-review/daily-review-status'
import { WeeklyReviewOutput } from '@/components/reviews/weekly-review/weekly-review-output'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

type Summary = {
  tradeCount: number
  tradingDayCount: number
  approvedDailyReviewCount: number
  gameDayReviewCount: number
  hasReflection: boolean
}

export function WeeklyReviewPage({ weekStartDate }: { weekStartDate: string }) {
  const supabase = React.useMemo(() => createClient(), [])

  const [userId, setUserId] = React.useState<string | null>(null)
  const [review, setReview] = React.useState<WeeklyReview | null>(null)
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

      const weekEndDate = getWeekEndIso(weekStartDate)

      const [existingReview, trades, reflection, dailyReviewRows, gameDayRows] = await Promise.all([
        getWeeklyReview(supabase, user.id, weekStartDate),
        getTrades(supabase, user.id, { dateFrom: weekStartDate, dateTo: weekEndDate }),
        getWeeklyReflection(supabase, user.id, weekStartDate),
        supabase
          .from('daily_reviews')
          .select('id')
          .eq('user_id', user.id)
          .gte('date', weekStartDate)
          .lte('date', weekEndDate)
          .eq('status', 'approved'),
        supabase
          .from('game_day_reviews')
          .select('id')
          .eq('user_id', user.id)
          .gte('date', weekStartDate)
          .lte('date', weekEndDate),
      ])

      const tradingDays = new Set(trades.map((t) => t.date)).size

      setReview(existingReview)
      setOutputText(toText(existingReview?.approved_content ?? existingReview?.generated_content ?? null))
      setSummary({
        tradeCount: trades.length,
        tradingDayCount: tradingDays,
        approvedDailyReviewCount: dailyReviewRows.data?.length ?? 0,
        gameDayReviewCount: gameDayRows.data?.length ?? 0,
        hasReflection: Boolean(reflection),
      })
      setIsLoading(false)
    }

    load()
  }, [supabase, weekStartDate])

  React.useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false
      return
    }

    if (!review || review.status !== 'draft') {
      return
    }

    setSaveStatus('saving')

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(async () => {
      try {
        await updateWeeklyReviewContent(supabase, review.id, outputText)
        setSaveStatus('saved')
      } catch {
        setSaveStatus('error')
      }
    }, 1000)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outputText])

  async function handleGenerate() {
    if (!userId) return

    setIsGenerating(true)
    setGenerateError(null)

    try {
      const response = await fetch('/api/engines/weekly-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekStartDate }),
      })

      const body = await response.json()

      if (!response.ok) {
        throw new Error(body?.error ?? 'Genereren is mislukt.')
      }

      const created = await createWeeklyReview(supabase, userId, weekStartDate, body.content as string)
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
      const approved = await approveWeeklyReview(supabase, review.id, outputText)
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

  const insufficientData = summary.tradeCount === 0

  return (
    <div className="space-y-6">
      <DailyReviewStatus status={uiStatus} />

      <Card>
        <CardContent className="flex flex-wrap gap-6 pt-6 text-sm">
          <span>{summary.tradingDayCount} tradingdag{summary.tradingDayCount !== 1 ? 'en' : ''}</span>
          <span>{summary.tradeCount} trade{summary.tradeCount !== 1 ? 's' : ''}</span>
          <span>
            {summary.approvedDailyReviewCount > 0
              ? `${summary.approvedDailyReviewCount} Daily Review${summary.approvedDailyReviewCount !== 1 ? 's' : ''} goedgekeurd`
              : 'Geen goedgekeurde Daily Reviews'}
          </span>
          <span>
            {summary.gameDayReviewCount > 0
              ? `${summary.gameDayReviewCount} Game Day${summary.gameDayReviewCount !== 1 ? 's' : ''}`
              : 'Geen Game Days'}
          </span>
          <span>{summary.hasReflection ? '✅' : '❌'} Weekly Reflectie</span>
        </CardContent>
      </Card>

      {insufficientData && (
        <p className="text-sm text-amber-400">Onvoldoende data — log eerst trades deze week.</p>
      )}

      {uiStatus === 'not_generated' && (
        <div className="space-y-2">
          <Button onClick={handleGenerate} disabled={isGenerating || summary.tradeCount === 0}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Weekly Review wordt gegenereerd...
              </>
            ) : (
              'Weekly Review genereren'
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
          <WeeklyReviewOutput
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
                {isApproving ? 'Bezig...' : 'Weekly Review goedkeuren'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
