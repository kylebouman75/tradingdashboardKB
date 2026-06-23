import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/supabase'
import { getWeekEndIso } from '@/lib/week'
import { getPitfalls, getWeeklyReflection, type WeeklyReflection } from '@/lib/weekly-reflection'
import { getEmotions, getTrades, type Trade } from '@/lib/trades'
import type { DailyReview } from '@/lib/daily-review'
import type { GameDayReview } from '@/lib/game-day'

export type WeeklyReview = Database['public']['Tables']['weekly_reviews']['Row']

export type WeeklyReviewTrade = Trade & { emotionName: string | null }

export type HistoricalWeeklyReview = {
  weekStartDate: string
  summary: string | null
}

export type WeeklyReviewContext = {
  weekStartDate: string
  weekEndDate: string
  trades: WeeklyReviewTrade[]
  tradingDayCount: number
  approvedDailyReviews: Array<{ date: string; content: string }>
  gameDayReviews: Array<{ date: string; classification: string; summary: string | null }>
  reflection: WeeklyReflection | null
  pitfallNames: string[]
  historicalReviews: HistoricalWeeklyReview[]
}

export function toText(value: WeeklyReview['generated_content']): string {
  return typeof value === 'string' ? value : ''
}

export async function getWeeklyReview(
  supabase: SupabaseClient<Database>,
  userId: string,
  weekStartDate: string
): Promise<WeeklyReview | null> {
  const { data, error } = await supabase
    .from('weekly_reviews')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start_date', weekStartDate)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

// Geen unique constraint op (user_id, week_start_date) in het schema, dus we
// simuleren upsert-gedrag zelf via check-then-insert (alleen bij aanmaak nodig).
export async function createWeeklyReview(
  supabase: SupabaseClient<Database>,
  userId: string,
  weekStartDate: string,
  generatedContent: string
): Promise<WeeklyReview> {
  const { data, error } = await supabase
    .from('weekly_reviews')
    .insert({
      user_id: userId,
      week_start_date: weekStartDate,
      status: 'draft',
      generated_content: generatedContent,
      approved_content: generatedContent,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function updateWeeklyReviewContent(
  supabase: SupabaseClient<Database>,
  id: string,
  approvedContent: string
): Promise<WeeklyReview> {
  const { data, error } = await supabase
    .from('weekly_reviews')
    .update({ approved_content: approvedContent })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function approveWeeklyReview(
  supabase: SupabaseClient<Database>,
  id: string,
  finalContent: string
): Promise<WeeklyReview> {
  const { data, error } = await supabase
    .from('weekly_reviews')
    .update({ status: 'approved', approved_content: finalContent })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

async function getApprovedDailyReviewsForWeek(
  supabase: SupabaseClient<Database>,
  userId: string,
  weekStartDate: string,
  weekEndDate: string
): Promise<DailyReview[]> {
  const { data, error } = await supabase
    .from('daily_reviews')
    .select('*')
    .eq('user_id', userId)
    .gte('date', weekStartDate)
    .lte('date', weekEndDate)
    .eq('status', 'approved')
    .order('date', { ascending: true })

  if (error) {
    throw error
  }

  return data ?? []
}

async function getGameDayReviewsForWeek(
  supabase: SupabaseClient<Database>,
  userId: string,
  weekStartDate: string,
  weekEndDate: string
): Promise<GameDayReview[]> {
  const { data, error } = await supabase
    .from('game_day_reviews')
    .select('*')
    .eq('user_id', userId)
    .gte('date', weekStartDate)
    .lte('date', weekEndDate)
    .order('date', { ascending: true })

  if (error) {
    throw error
  }

  return data ?? []
}

async function getHistoricalWeeklyReviews(
  supabase: SupabaseClient<Database>,
  userId: string,
  weekStartDate: string,
  weeks: number
): Promise<HistoricalWeeklyReview[]> {
  const { data, error } = await supabase
    .from('weekly_reviews')
    .select('week_start_date, approved_content')
    .eq('user_id', userId)
    .lt('week_start_date', weekStartDate)
    .order('week_start_date', { ascending: false })
    .limit(weeks)

  if (error) {
    throw error
  }

  return (data ?? [])
    .map((row) => ({
      weekStartDate: row.week_start_date,
      summary: typeof row.approved_content === 'string' ? row.approved_content : null,
    }))
    .reverse()
}

export async function getWeeklyReviewContext(
  supabase: SupabaseClient<Database>,
  userId: string,
  weekStartDate: string
): Promise<WeeklyReviewContext> {
  const weekEndDate = getWeekEndIso(weekStartDate)

  const [trades, emotions, approvedDailyReviewRows, gameDayReviewRows, reflection, pitfalls, historicalReviews] =
    await Promise.all([
      getTrades(supabase, userId, { dateFrom: weekStartDate, dateTo: weekEndDate }),
      getEmotions(supabase, userId),
      getApprovedDailyReviewsForWeek(supabase, userId, weekStartDate, weekEndDate),
      getGameDayReviewsForWeek(supabase, userId, weekStartDate, weekEndDate),
      getWeeklyReflection(supabase, userId, weekStartDate),
      getPitfalls(supabase, userId),
      getHistoricalWeeklyReviews(supabase, userId, weekStartDate, 4),
    ])

  const emotionMap = new Map(emotions.map((emotion) => [emotion.id, emotion.name]))
  const pitfallMap = new Map(pitfalls.map((pitfall) => [pitfall.id, pitfall.name]))

  const tradesWithEmotion: WeeklyReviewTrade[] = trades.map((trade) => ({
    ...trade,
    emotionName: trade.emotion_id ? emotionMap.get(trade.emotion_id) ?? null : null,
  }))

  const tradingDayCount = new Set(trades.map((trade) => trade.date)).size

  const approvedDailyReviews = approvedDailyReviewRows.map((row) => ({
    date: row.date,
    content: typeof row.approved_content === 'string' ? row.approved_content : '',
  }))

  const gameDayReviews = gameDayReviewRows
    .filter((row): row is GameDayReview & { classification: string } => Boolean(row.classification))
    .map((row) => ({
      date: row.date,
      classification: row.classification,
      summary:
        row.status === 'approved' && typeof row.approved_content === 'string'
          ? row.approved_content
          : null,
    }))

  const pitfallIds = Array.isArray(reflection?.recurring_pitfalls)
    ? reflection.recurring_pitfalls.filter((id): id is string => typeof id === 'string')
    : []

  const pitfallNames = pitfallIds
    .map((id) => pitfallMap.get(id))
    .filter((name): name is string => Boolean(name))

  return {
    weekStartDate,
    weekEndDate,
    trades: tradesWithEmotion,
    tradingDayCount,
    approvedDailyReviews,
    gameDayReviews,
    reflection,
    pitfallNames,
    historicalReviews,
  }
}

