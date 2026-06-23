'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { getPreMarketEntry } from '@/lib/pre-market'
import { getPostMarketEntry } from '@/lib/post-market'
import { getTrades } from '@/lib/trades'
import {
  approveGameDayReview,
  createGameDayReview,
  getGameDayReview,
  toText,
  updateGameDayContent,
  type GameDayReview,
} from '@/lib/game-day'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DailyReviewStatus, type DailyReviewUiStatus } from '@/components/reviews/daily-review/daily-review-status'
import { GameDayClassification } from '@/components/reviews/game-day/game-day-classification'
import { GameDayOutput } from '@/components/reviews/game-day/game-day-output'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

type Summary = {
  hasPreMarket: boolean
  hasPostMarket: boolean
  tradeCount: number
}

export function GameDayPage({ date }: { date: string }) {
  const supabase = React.useMemo(() => createClient(), [])

  const [userId, setUserId] = React.useState<string | null>(null)
  const [review, setReview] = React.useState<GameDayReview | null>(null)
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

      const [existingReview, preMarket, postMarket, trades] = await Promise.all([
        getGameDayReview(supabase, user.id, date),
        getPreMarketEntry(supabase, user.id, date),
        getPostMarketEntry(supabase, user.id, date),
        getTrades(supabase, user.id, { dateFrom: date, dateTo: date }),
      ])

      setReview(existingReview)
      setOutputText(toText(existingReview?.approved_content ?? existingReview?.generated_content ?? null))
      setSummary({
        hasPreMarket: Boolean(preMarket),
        hasPostMarket: Boolean(postMarket),
        tradeCount: trades.length,
      })
      setIsLoading(false)
    }

    load()
  }, [supabase, date])

  // Autosave van bewerkingen tijdens de draft-fase naar approved_content.
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
        await updateGameDayContent(supabase, review.id, outputText)
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
      const response = await fetch('/api/engines/game-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      })

      const body = await response.json()

      if (!response.ok) {
        throw new Error(body?.error ?? 'Genereren is mislukt.')
      }

      const created = await createGameDayReview(
        supabase,
        userId,
        date,
        body.content as string,
        body.classification as NonNullable<GameDayReview['classification']>
      )
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
      const approved = await approveGameDayReview(supabase, review.id, outputText)
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
          <span>{summary.hasPreMarket ? '✅' : '❌'} Pre-Market aanwezig</span>
          <span>{summary.hasPostMarket ? '✅' : '❌'} Post-Market aanwezig</span>
          <span>
            {summary.tradeCount > 0 ? `${summary.tradeCount} trades gelogd` : 'Geen trades'}
          </span>
        </CardContent>
      </Card>

      {insufficientData && (
        <p className="text-sm text-amber-400">Onvoldoende data — log eerst trades.</p>
      )}

      {uiStatus === 'not_generated' && (
        <div className="space-y-2">
          <Button onClick={handleGenerate} disabled={isGenerating || summary.tradeCount === 0}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyse wordt gegenereerd...
              </>
            ) : (
              'Game Day genereren'
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
          {review.classification && (
            <GameDayClassification classification={review.classification} />
          )}

          <GameDayOutput
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
                {isApproving ? 'Bezig...' : 'Game Day goedkeuren'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
