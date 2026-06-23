import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/supabase'

export type Strategy = Database['public']['Tables']['strategies']['Row']
export type StrategyImage = Database['public']['Tables']['strategy_images']['Row']

export type CreateStrategyInput = Omit<
  Database['public']['Tables']['strategies']['Insert'],
  'id' | 'user_id' | 'created_at' | 'updated_at'
>
export type UpdateStrategyInput = Partial<CreateStrategyInput>

export async function getStrategies(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<Strategy[]> {
  const { data, error } = await supabase
    .from('strategies')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getStrategyById(
  supabase: SupabaseClient<Database>,
  id: string
): Promise<Strategy | null> {
  const { data, error } = await supabase
    .from('strategies')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function createStrategy(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: CreateStrategyInput
): Promise<Strategy> {
  const { data, error } = await supabase
    .from('strategies')
    .insert({ ...input, user_id: userId })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateStrategy(
  supabase: SupabaseClient<Database>,
  id: string,
  input: UpdateStrategyInput
): Promise<Strategy> {
  const { data, error } = await supabase
    .from('strategies')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteStrategy(
  supabase: SupabaseClient<Database>,
  id: string
): Promise<void> {
  const { error } = await supabase.from('strategies').delete().eq('id', id)
  if (error) throw error
}

export async function getStrategyImages(
  supabase: SupabaseClient<Database>,
  strategyId: string
): Promise<StrategyImage[]> {
  const { data, error } = await supabase
    .from('strategy_images')
    .select('*')
    .eq('strategy_id', strategyId)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function createStrategyImage(
  supabase: SupabaseClient<Database>,
  strategyId: string,
  storageUrl: string,
  label: string | null = null
): Promise<StrategyImage> {
  const { data, error } = await supabase
    .from('strategy_images')
    .insert({ strategy_id: strategyId, storage_url: storageUrl, label })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateStrategyImageLabel(
  supabase: SupabaseClient<Database>,
  imageId: string,
  label: string | null
): Promise<StrategyImage> {
  const { data, error } = await supabase
    .from('strategy_images')
    .update({ label })
    .eq('id', imageId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteStrategyImageRecord(
  supabase: SupabaseClient<Database>,
  imageId: string
): Promise<void> {
  const { error } = await supabase.from('strategy_images').delete().eq('id', imageId)
  if (error) throw error
}
