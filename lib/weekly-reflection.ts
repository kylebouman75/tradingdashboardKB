import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/supabase'

export type WeeklyReflection = Database['public']['Tables']['weekly_reflections']['Row']

export type WeeklyReflectionInput = Omit<
  Database['public']['Tables']['weekly_reflections']['Insert'],
  'id' | 'user_id' | 'week_start_date' | 'completed_at' | 'created_at' | 'updated_at'
>

export const DEFAULT_WEEK_FEELINGS = [
  'Rustig',
  'Consistent',
  'Gefocust',
  'Twijfelend',
  'Onrustig',
  'Gefrustreerd',
  'Zelfverzekerd',
  'Geduldig',
]

export async function getWeeklyReflection(
  supabase: SupabaseClient<Database>,
  userId: string,
  weekStartDate: string
): Promise<WeeklyReflection | null> {
  const { data, error } = await supabase
    .from('weekly_reflections')
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
// simuleren upsert-gedrag zelf: bestaat de reflectie al, dan update, anders insert.
export async function upsertWeeklyReflection(
  supabase: SupabaseClient<Database>,
  userId: string,
  weekStartDate: string,
  input: Partial<WeeklyReflectionInput>
): Promise<WeeklyReflection> {
  const existing = await getWeeklyReflection(supabase, userId, weekStartDate)

  if (existing) {
    const { data, error } = await supabase
      .from('weekly_reflections')
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
    .from('weekly_reflections')
    .insert({ ...input, user_id: userId, week_start_date: weekStartDate })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function completeWeeklyReflection(
  supabase: SupabaseClient<Database>,
  id: string
): Promise<WeeklyReflection> {
  const { data, error } = await supabase
    .from('weekly_reflections')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export { getPitfalls } from '@/lib/post-market'
