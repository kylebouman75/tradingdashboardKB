import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/supabase'

export type Trade = Database['public']['Tables']['trades']['Row']
export type TradingSession = Database['public']['Tables']['trading_sessions']['Row']
export type Emotion = Database['public']['Tables']['emotions']['Row']
export type TradeScreenshot = Database['public']['Tables']['trade_screenshots']['Row']
export type ScreenshotLabel = Database['public']['Tables']['screenshot_labels']['Row']
export type CustomFieldDefinition =
  Database['public']['Tables']['custom_field_definitions']['Row']
export type CustomFieldType = CustomFieldDefinition['type']

export type CreateTradeInput = Omit<
  Database['public']['Tables']['trades']['Insert'],
  'id' | 'user_id' | 'created_at' | 'updated_at'
>
export type UpdateTradeInput = Partial<CreateTradeInput>

export type CreateCustomFieldInput = Omit<
  Database['public']['Tables']['custom_field_definitions']['Insert'],
  'id' | 'user_id' | 'created_at' | 'updated_at'
>

export type TradeFilters = {
  outcome?: 'win' | 'loss' | 'breakeven'
  direction?: 'long' | 'short'
  dateFrom?: string
  dateTo?: string
  sortBy?: 'date' | 'symbol' | 'rr' | 'outcome'
  sortDirection?: 'asc' | 'desc'
}

export async function getTrades(
  supabase: SupabaseClient<Database>,
  userId: string,
  filters?: TradeFilters
): Promise<Trade[]> {
  let query = supabase.from('trades').select('*').eq('user_id', userId)

  if (filters?.outcome) {
    query = query.eq('outcome', filters.outcome)
  }
  if (filters?.direction) {
    query = query.eq('direction', filters.direction)
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

  if (error) {
    throw error
  }

  return data ?? []
}

export async function getTradeById(
  supabase: SupabaseClient<Database>,
  id: string
): Promise<Trade | null> {
  const { data, error } = await supabase.from('trades').select('*').eq('id', id).maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export async function createTrade(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: CreateTradeInput
): Promise<Trade> {
  const { data, error } = await supabase
    .from('trades')
    .insert({ ...input, user_id: userId })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function updateTrade(
  supabase: SupabaseClient<Database>,
  id: string,
  input: UpdateTradeInput
): Promise<Trade> {
  const { data, error } = await supabase
    .from('trades')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function deleteTrade(
  supabase: SupabaseClient<Database>,
  id: string
): Promise<void> {
  const { error } = await supabase.from('trades').delete().eq('id', id)

  if (error) {
    throw error
  }
}

export async function getTradingSessions(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<TradingSession[]> {
  const { data, error } = await supabase
    .from('trading_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })

  if (error) {
    throw error
  }

  return data ?? []
}

export async function getEmotions(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<Emotion[]> {
  const { data, error } = await supabase
    .from('emotions')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })

  if (error) {
    throw error
  }

  return data ?? []
}

export const DEFAULT_TRADING_SESSIONS = [
  'London',
  'New York AM',
  'New York PM',
  'London → New York Overlap',
]

export const DEFAULT_EMOTIONS = [
  'Rustig',
  'Gefocust',
  'Zelfverzekerd',
  'Twijfel',
  'FOMO',
  'Gestrest',
  'Gehaast',
  'Gefrustreerd',
]

export async function ensureSeedData(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<void> {
  const { count: sessionCount, error: sessionCountError } = await supabase
    .from('trading_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (sessionCountError) {
    throw sessionCountError
  }

  if (!sessionCount) {
    await supabase.from('trading_sessions').insert(
      DEFAULT_TRADING_SESSIONS.map((name, index) => ({
        user_id: userId,
        name,
        sort_order: index,
      }))
    )
  }

  const { count: emotionCount, error: emotionCountError } = await supabase
    .from('emotions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (emotionCountError) {
    throw emotionCountError
  }

  if (!emotionCount) {
    await supabase.from('emotions').insert(
      DEFAULT_EMOTIONS.map((name, index) => ({
        user_id: userId,
        name,
        sort_order: index,
      }))
    )
  }
}

export const DEFAULT_SCREENSHOT_LABELS = ['Pre-trade', 'During trade', 'Post-trade']

export async function getScreenshotLabels(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<ScreenshotLabel[]> {
  const { data, error } = await supabase
    .from('screenshot_labels')
    .select('*')
    .eq('user_id', userId)
    .eq('context', 'trade')
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  return data ?? []
}

export async function ensureScreenshotLabelsSeed(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<void> {
  const { count, error } = await supabase
    .from('screenshot_labels')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('context', 'trade')

  if (error) {
    throw error
  }

  if (!count) {
    await supabase.from('screenshot_labels').insert(
      DEFAULT_SCREENSHOT_LABELS.map((name) => ({
        user_id: userId,
        name,
        context: 'trade' as const,
      }))
    )
  }
}

export async function createScreenshotLabel(
  supabase: SupabaseClient<Database>,
  userId: string,
  name: string
): Promise<ScreenshotLabel> {
  const { data, error } = await supabase
    .from('screenshot_labels')
    .insert({ user_id: userId, name, context: 'trade' as const })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function updateScreenshotLabel(
  supabase: SupabaseClient<Database>,
  id: string,
  name: string
): Promise<ScreenshotLabel> {
  const { data, error } = await supabase
    .from('screenshot_labels')
    .update({ name })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function deleteScreenshotLabel(
  supabase: SupabaseClient<Database>,
  id: string
): Promise<void> {
  const { error } = await supabase.from('screenshot_labels').delete().eq('id', id)

  if (error) {
    throw error
  }
}

export async function getTradeScreenshots(
  supabase: SupabaseClient<Database>,
  tradeId: string
): Promise<TradeScreenshot[]> {
  const { data, error } = await supabase
    .from('trade_screenshots')
    .select('*')
    .eq('trade_id', tradeId)
    .order('sort_order', { ascending: true })

  if (error) {
    throw error
  }

  return data ?? []
}

export async function createTradeScreenshot(
  supabase: SupabaseClient<Database>,
  tradeId: string,
  storageUrl: string,
  label: string | null = null
): Promise<TradeScreenshot> {
  const { data, error } = await supabase
    .from('trade_screenshots')
    .insert({ trade_id: tradeId, storage_url: storageUrl, label })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function updateTradeScreenshotLabel(
  supabase: SupabaseClient<Database>,
  screenshotId: string,
  label: string | null
): Promise<TradeScreenshot> {
  const { data, error } = await supabase
    .from('trade_screenshots')
    .update({ label })
    .eq('id', screenshotId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function deleteTradeScreenshotRecord(
  supabase: SupabaseClient<Database>,
  screenshotId: string
): Promise<void> {
  const { error } = await supabase.from('trade_screenshots').delete().eq('id', screenshotId)

  if (error) {
    throw error
  }
}

export async function getCustomFieldDefinitions(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<CustomFieldDefinition[]> {
  const { data, error } = await supabase
    .from('custom_field_definitions')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })

  if (error) {
    throw error
  }

  return data ?? []
}

export async function createCustomFieldDefinition(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: CreateCustomFieldInput
): Promise<CustomFieldDefinition> {
  const { data, error } = await supabase
    .from('custom_field_definitions')
    .insert({ ...input, user_id: userId })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function updateCustomFieldDefinition(
  supabase: SupabaseClient<Database>,
  id: string,
  input: Partial<CreateCustomFieldInput>
): Promise<CustomFieldDefinition> {
  const { data, error } = await supabase
    .from('custom_field_definitions')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function deleteCustomFieldDefinition(
  supabase: SupabaseClient<Database>,
  id: string
): Promise<void> {
  const { error } = await supabase.from('custom_field_definitions').delete().eq('id', id)

  if (error) {
    throw error
  }
}
