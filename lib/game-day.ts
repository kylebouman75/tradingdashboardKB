import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/supabase'
import { getPreMarketEntry, type PreMarketEntry } from '@/lib/pre-market'
import { getPitfalls, getPostMarketEntry, type PostMarketEntry } from '@/lib/post-market'
import { getEmotions, getTrades, getTradingSessions, type Trade } from '@/lib/trades'

export type GameDayReview = Database['public']['Tables']['game_day_reviews']['Row']
export type GameDayClassificationValue = NonNullable<GameDayReview['classification']>

export type GameDayTrade = Trade & { emotionName: string | null }

export type RecentClassification = {
  date: string
  classification: GameDayClassificationValue
}

export type GameDayContext = {
  date: string
  preMarket: PreMarketEntry | null
  sessionName: string | null
  trades: GameDayTrade[]
  postMarket: PostMarketEntry | null
  pitfallNames: string[]
  recentClassifications: RecentClassification[]
}

export function toText(value: GameDayReview['generated_content']): string {
  return typeof value === 'string' ? value : ''
}

export async function getGameDayReview(
  supabase: SupabaseClient<Database>,
  userId: string,
  date: string
): Promise<GameDayReview | null> {
  const { data, error } = await supabase
    .from('game_day_reviews')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export async function createGameDayReview(
  supabase: SupabaseClient<Database>,
  userId: string,
  date: string,
  generatedContent: string,
  classification: GameDayClassificationValue
): Promise<GameDayReview> {
  const { data, error } = await supabase
    .from('game_day_reviews')
    .insert({
      user_id: userId,
      date,
      status: 'draft',
      classification,
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

export async function updateGameDayContent(
  supabase: SupabaseClient<Database>,
  id: string,
  approvedContent: string
): Promise<GameDayReview> {
  const { data, error } = await supabase
    .from('game_day_reviews')
    .update({ approved_content: approvedContent })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function approveGameDayReview(
  supabase: SupabaseClient<Database>,
  id: string,
  finalContent: string
): Promise<GameDayReview> {
  const { data, error } = await supabase
    .from('game_day_reviews')
    .update({ status: 'approved', approved_content: finalContent })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function getRecentClassifications(
  supabase: SupabaseClient<Database>,
  userId: string,
  date: string,
  days: number
): Promise<RecentClassification[]> {
  const { data, error } = await supabase
    .from('game_day_reviews')
    .select('date, classification')
    .eq('user_id', userId)
    .lt('date', date)
    .not('classification', 'is', null)
    .order('date', { ascending: false })
    .limit(days)

  if (error) {
    throw error
  }

  return (data ?? [])
    .filter((row): row is { date: string; classification: GameDayClassificationValue } =>
      Boolean(row.classification)
    )
    .reverse()
}

export async function getGameDayContext(
  supabase: SupabaseClient<Database>,
  userId: string,
  date: string
): Promise<GameDayContext> {
  const [preMarket, trades, postMarket, emotions, pitfalls, sessions, recentClassifications] =
    await Promise.all([
      getPreMarketEntry(supabase, userId, date),
      getTrades(supabase, userId, { dateFrom: date, dateTo: date }),
      getPostMarketEntry(supabase, userId, date),
      getEmotions(supabase, userId),
      getPitfalls(supabase, userId),
      getTradingSessions(supabase, userId),
      getRecentClassifications(supabase, userId, date, 7),
    ])

  const emotionMap = new Map(emotions.map((emotion) => [emotion.id, emotion.name]))
  const pitfallMap = new Map(pitfalls.map((pitfall) => [pitfall.id, pitfall.name]))
  const sessionMap = new Map(sessions.map((session) => [session.id, session.name]))

  const tradesWithEmotion: GameDayTrade[] = trades.map((trade) => ({
    ...trade,
    emotionName: trade.emotion_id ? emotionMap.get(trade.emotion_id) ?? null : null,
  }))

  const pitfallIds = Array.isArray(postMarket?.pitfalls_present)
    ? postMarket.pitfalls_present.filter((id): id is string => typeof id === 'string')
    : []

  const pitfallNames = pitfallIds
    .map((id) => pitfallMap.get(id))
    .filter((name): name is string => Boolean(name))

  const sessionName = preMarket?.session_id ? sessionMap.get(preMarket.session_id) ?? null : null

  return {
    date,
    preMarket,
    sessionName,
    trades: tradesWithEmotion,
    postMarket,
    pitfallNames,
    recentClassifications,
  }
}
