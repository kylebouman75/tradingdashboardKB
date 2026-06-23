import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/supabase'

export type PostMarketEntry = Database['public']['Tables']['post_market_entries']['Row']
export type Pitfall = Database['public']['Tables']['pitfalls']['Row']

export type PostMarketEntryInput = Omit<
  Database['public']['Tables']['post_market_entries']['Insert'],
  'id' | 'user_id' | 'date' | 'created_at' | 'updated_at'
>

export async function getPostMarketEntry(
  supabase: SupabaseClient<Database>,
  userId: string,
  date: string
): Promise<PostMarketEntry | null> {
  const { data, error } = await supabase
    .from('post_market_entries')
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
export async function upsertPostMarketEntry(
  supabase: SupabaseClient<Database>,
  userId: string,
  date: string,
  input: Partial<PostMarketEntryInput>
): Promise<PostMarketEntry> {
  const existing = await getPostMarketEntry(supabase, userId, date)

  if (existing) {
    const { data, error } = await supabase
      .from('post_market_entries')
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
    .from('post_market_entries')
    .insert({ ...input, user_id: userId, date })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export const DEFAULT_PITFALLS = [
  'FOMO',
  'Overanalyse',
  'Resultaatgericht denken',
  'Hindsight bias',
  'Controlebehoefte',
  'Externe ruis',
  'Perfectionisme',
]

export async function getPitfalls(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<Pitfall[]> {
  const { data, error } = await supabase
    .from('pitfalls')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })

  if (error) {
    throw error
  }

  return data ?? []
}

export async function seedPitfalls(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<void> {
  const { count, error } = await supabase
    .from('pitfalls')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) {
    throw error
  }

  if (!count) {
    await supabase.from('pitfalls').insert(
      DEFAULT_PITFALLS.map((name, index) => ({
        user_id: userId,
        name,
        sort_order: index,
      }))
    )
  }
}
