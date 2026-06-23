import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/supabase'

export type PreMarketEntry = Database['public']['Tables']['pre_market_entries']['Row']

export type PreMarketEntryInput = Omit<
  Database['public']['Tables']['pre_market_entries']['Insert'],
  'id' | 'user_id' | 'date' | 'created_at' | 'updated_at'
>

export async function getPreMarketEntry(
  supabase: SupabaseClient<Database>,
  userId: string,
  date: string
): Promise<PreMarketEntry | null> {
  const { data, error } = await supabase
    .from('pre_market_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

// Geen unique constraint op (user_id, date) in het schema, dus we simuleren
// upsert-gedrag zelf: bestaat de entry al, dan update, anders insert.
export async function upsertPreMarketEntry(
  supabase: SupabaseClient<Database>,
  userId: string,
  date: string,
  input: Partial<PreMarketEntryInput>
): Promise<PreMarketEntry> {
  const existing = await getPreMarketEntry(supabase, userId, date)

  if (existing) {
    const { data, error } = await supabase
      .from('pre_market_entries')
      .update(input)
      .eq('id', existing.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  }

  const { data, error } = await supabase
    .from('pre_market_entries')
    .insert({ ...input, user_id: userId, date })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}
