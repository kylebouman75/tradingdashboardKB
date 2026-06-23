import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/supabase'
import { getMonthDateRange } from '@/lib/month'
import { getMonthlyReflection, type MonthlyReflection } from '@/lib/monthly-reflection'
import { getTrades, type Trade } from '@/lib/trades'

export type MonthlyReview = Database['public']['Tables']['monthly_reviews']['Row']

export type HistoricalMonthlyReview = {
  monthYear: string
  summary: string | null
}

export type MonthlyReviewContext = {
  monthYear: string
  monthFrom: string
  monthTo: string
  trades: Trade[]
  tradingDayCount: number
  approvedWeeklyReviews: Array<{ weekStartDate: string; content: string }>
  reflection: MonthlyReflection | null
  historicalReviews: HistoricalMonthlyReview[]
}

export function toText(value: MonthlyReview['generated_content']): string {
  return typeof value === 'string' ? value : ''
}

export async function getMonthlyReview(
  supabase: SupabaseClient<Database>,
  userId: string,
  monthYear: string
): Promise<MonthlyReview | null> {
  const { data, error } = await supabase
    .from('monthly_reviews')
    .select('*')
    .eq('user_id', userId)
    .eq('month_year', monthYear)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function createMonthlyReview(
  supabase: SupabaseClient<Database>,
  userId: string,
  monthYear: string,
  generatedContent: string
): Promise<MonthlyReview> {
  const { data, error } = await supabase
    .from('monthly_reviews')
    .insert({
      user_id: userId,
      month_year: monthYear,
      status: 'draft',
      generated_content: generatedContent,
      approved_content: generatedContent,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateMonthlyReviewContent(
  supabase: SupabaseClient<Database>,
  id: string,
  approvedContent: string
): Promise<MonthlyReview> {
  const { data, error } = await supabase
    .from('monthly_reviews')
    .update({ approved_content: approvedContent })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function approveMonthlyReview(
  supabase: SupabaseClient<Database>,
  id: string,
  finalContent: string
): Promise<MonthlyReview> {
  const { data, error } = await supabase
    .from('monthly_reviews')
    .update({ status: 'approved', approved_content: finalContent })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

async function getApprovedWeeklyReviewsForMonth(
  supabase: SupabaseClient<Database>,
  userId: string,
  monthFrom: string,
  monthTo: string
): Promise<Array<{ weekStartDate: string; content: string }>> {
  const { data, error } = await supabase
    .from('weekly_reviews')
    .select('week_start_date, approved_content')
    .eq('user_id', userId)
    .gte('week_start_date', monthFrom)
    .lte('week_start_date', monthTo)
    .eq('status', 'approved')
    .order('week_start_date', { ascending: true })

  if (error) throw error

  return (data ?? [])
    .filter((row) => typeof row.approved_content === 'string')
    .map((row) => ({
      weekStartDate: row.week_start_date,
      content: row.approved_content as string,
    }))
}

async function getHistoricalMonthlyReviews(
  supabase: SupabaseClient<Database>,
  userId: string,
  monthYear: string,
  months: number
): Promise<HistoricalMonthlyReview[]> {
  const { data, error } = await supabase
    .from('monthly_reviews')
    .select('month_year, approved_content')
    .eq('user_id', userId)
    .lt('month_year', monthYear)
    .order('month_year', { ascending: false })
    .limit(months)

  if (error) throw error

  return (data ?? [])
    .map((row) => ({
      monthYear: row.month_year,
      summary: typeof row.approved_content === 'string' ? row.approved_content : null,
    }))
    .reverse()
}

export async function getMonthlyReviewContext(
  supabase: SupabaseClient<Database>,
  userId: string,
  monthYear: string
): Promise<MonthlyReviewContext> {
  const { from: monthFrom, to: monthTo } = getMonthDateRange(monthYear)

  const [trades, approvedWeeklyReviews, reflection, historicalReviews] = await Promise.all([
    getTrades(supabase, userId, { dateFrom: monthFrom, dateTo: monthTo }),
    getApprovedWeeklyReviewsForMonth(supabase, userId, monthFrom, monthTo),
    getMonthlyReflection(supabase, userId, monthYear),
    getHistoricalMonthlyReviews(supabase, userId, monthYear, 3),
  ])

  const tradingDayCount = new Set(trades.map((t) => t.date)).size

  return {
    monthYear,
    monthFrom,
    monthTo,
    trades,
    tradingDayCount,
    approvedWeeklyReviews,
    reflection,
    historicalReviews,
  }
}
