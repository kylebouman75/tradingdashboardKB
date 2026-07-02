import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/supabase'

export type Backtest = Database['public']['Tables']['backtests']['Row']
export type BacktestScreenshot = Database['public']['Tables']['backtest_screenshots']['Row']
export type ScreenshotLabel = Database['public']['Tables']['screenshot_labels']['Row']

export type CreateBacktestInput = Omit<
  Database['public']['Tables']['backtests']['Insert'],
  'id' | 'user_id' | 'created_at' | 'updated_at'
>
export type UpdateBacktestInput = Partial<CreateBacktestInput>

export type BacktestFilters = {
  symbol?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: 'date' | 'symbol' | 'rr'
  sortDirection?: 'asc' | 'desc'
}

export async function getBacktests(
  supabase: SupabaseClient<Database>,
  userId: string,
  filters?: BacktestFilters
): Promise<Backtest[]> {
  let query = supabase.from('backtests').select('*').eq('user_id', userId)

  if (filters?.symbol) {
    query = query.ilike('symbol', `%${filters.symbol}%`)
  }
  if (filters?.dateFrom) {
    query = query.gte('date', filters.dateFrom)
  }
  if (filters?.dateTo) {
    query = query.lte('date', filters.dateTo)
  }

  const sortBy = filters?.sortBy ?? 'date'
  const ascending = filters?.sortDirection === 'asc'
  query = query.order(sortBy, { ascending })

  const { data, error } = await query

  if (error) throw error
  return data ?? []
}

export async function getBacktestById(
  supabase: SupabaseClient<Database>,
  id: string
): Promise<Backtest | null> {
  const { data, error } = await supabase.from('backtests').select('*').eq('id', id).maybeSingle()

  if (error) throw error
  return data
}

export async function createBacktest(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: CreateBacktestInput
): Promise<Backtest> {
  const { data, error } = await supabase
    .from('backtests')
    .insert({ ...input, user_id: userId })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateBacktest(
  supabase: SupabaseClient<Database>,
  id: string,
  input: UpdateBacktestInput
): Promise<Backtest> {
  const { data, error } = await supabase
    .from('backtests')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteBacktest(
  supabase: SupabaseClient<Database>,
  id: string
): Promise<void> {
  const { error } = await supabase.from('backtests').delete().eq('id', id)
  if (error) throw error
}

// ─── Backtest Screenshots ──────────────────────────────────────────────────

export async function getBacktestScreenshots(
  supabase: SupabaseClient<Database>,
  backtestId: string
): Promise<BacktestScreenshot[]> {
  const { data, error } = await supabase
    .from('backtest_screenshots')
    .select('*')
    .eq('backtest_id', backtestId)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function createBacktestScreenshot(
  supabase: SupabaseClient<Database>,
  backtestId: string,
  storageUrl: string,
  label: string | null = null
): Promise<BacktestScreenshot> {
  const { data, error } = await supabase
    .from('backtest_screenshots')
    .insert({ backtest_id: backtestId, storage_url: storageUrl, label })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateBacktestScreenshotLabel(
  supabase: SupabaseClient<Database>,
  screenshotId: string,
  label: string | null
): Promise<BacktestScreenshot> {
  const { data, error } = await supabase
    .from('backtest_screenshots')
    .update({ label })
    .eq('id', screenshotId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteBacktestScreenshotRecord(
  supabase: SupabaseClient<Database>,
  screenshotId: string
): Promise<void> {
  const { error } = await supabase.from('backtest_screenshots').delete().eq('id', screenshotId)
  if (error) throw error
}

// ─── Screenshot labels (context: backtest) ─────────────────────────────────

export const DEFAULT_BACKTEST_SCREENSHOT_LABELS = ['Pre-backtest', 'Post-backtest']

export async function getBacktestScreenshotLabels(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<ScreenshotLabel[]> {
  const { data, error } = await supabase
    .from('screenshot_labels')
    .select('*')
    .eq('user_id', userId)
    .eq('context', 'backtest')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function ensureBacktestScreenshotLabelsSeed(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<void> {
  const { count, error } = await supabase
    .from('screenshot_labels')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('context', 'backtest')

  if (error) throw error

  if (!count) {
    await supabase.from('screenshot_labels').insert(
      DEFAULT_BACKTEST_SCREENSHOT_LABELS.map((name) => ({
        user_id: userId,
        name,
        context: 'backtest' as const,
      }))
    )
  }
}

export async function createBacktestScreenshotLabel(
  supabase: SupabaseClient<Database>,
  userId: string,
  name: string
): Promise<ScreenshotLabel> {
  const { data, error } = await supabase
    .from('screenshot_labels')
    .insert({ user_id: userId, name, context: 'backtest' as const })
    .select()
    .single()

  if (error) throw error
  return data
}
