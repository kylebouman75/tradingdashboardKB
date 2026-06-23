import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/supabase'
import { getPreMarketEntry, type PreMarketEntry } from '@/lib/pre-market'
import { getPitfalls, getPostMarketEntry, type PostMarketEntry } from '@/lib/post-market'
import { getEmotions, getTrades, type Trade } from '@/lib/trades'

export type DailyReview = Database['public']['Tables']['daily_reviews']['Row']

export type DailyReviewTrade = Trade & { emotionName: string | null }

export type DailyReviewContext = {
  date: string
  preMarket: PreMarketEntry | null
  trades: DailyReviewTrade[]
  postMarket: PostMarketEntry | null
  pitfallNames: string[]
}

export function toText(value: DailyReview['generated_content']): string {
  return typeof value === 'string' ? value : ''
}

export async function getDailyReview(
  supabase: SupabaseClient<Database>,
  userId: string,
  date: string
): Promise<DailyReview | null> {
  const { data, error } = await supabase
    .from('daily_reviews')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export async function createDailyReview(
  supabase: SupabaseClient<Database>,
  userId: string,
  date: string,
  generatedContent: string
): Promise<DailyReview> {
  const { data, error } = await supabase
    .from('daily_reviews')
    .insert({
      user_id: userId,
      date,
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

export async function updateDailyReviewContent(
  supabase: SupabaseClient<Database>,
  id: string,
  approvedContent: string
): Promise<DailyReview> {
  const { data, error } = await supabase
    .from('daily_reviews')
    .update({ approved_content: approvedContent })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function approveDailyReview(
  supabase: SupabaseClient<Database>,
  id: string,
  finalContent: string
): Promise<DailyReview> {
  const { data, error } = await supabase
    .from('daily_reviews')
    .update({ status: 'approved', approved_content: finalContent })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function getDailyReviewContext(
  supabase: SupabaseClient<Database>,
  userId: string,
  date: string
): Promise<DailyReviewContext> {
  const [preMarket, trades, postMarket, emotions, pitfalls] = await Promise.all([
    getPreMarketEntry(supabase, userId, date),
    getTrades(supabase, userId, { dateFrom: date, dateTo: date }),
    getPostMarketEntry(supabase, userId, date),
    getEmotions(supabase, userId),
    getPitfalls(supabase, userId),
  ])

  const emotionMap = new Map(emotions.map((emotion) => [emotion.id, emotion.name]))
  const pitfallMap = new Map(pitfalls.map((pitfall) => [pitfall.id, pitfall.name]))

  const tradesWithEmotion: DailyReviewTrade[] = trades.map((trade) => ({
    ...trade,
    emotionName: trade.emotion_id ? emotionMap.get(trade.emotion_id) ?? null : null,
  }))

  const pitfallIds = Array.isArray(postMarket?.pitfalls_present)
    ? postMarket.pitfalls_present.filter((id): id is string => typeof id === 'string')
    : []

  const pitfallNames = pitfallIds
    .map((id) => pitfallMap.get(id))
    .filter((name): name is string => Boolean(name))

  return {
    date,
    preMarket,
    trades: tradesWithEmotion,
    postMarket,
    pitfallNames,
  }
}
