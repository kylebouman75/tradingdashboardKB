import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/supabase'

export type MonthlyReflection = Database['public']['Tables']['monthly_reflections']['Row']

export type MonthlyReflectionInput = Omit<
  Database['public']['Tables']['monthly_reflections']['Insert'],
  'id' | 'user_id' | 'month_year' | 'completed_at' | 'created_at' | 'updated_at'
>

export const DEFAULT_MONTH_FEELINGS = [
  'Consistent',
  'Gefocust',
  'Zelfverzekerd',
  'Groeiend',
  'Gedisciplineerd',
  'Geduldig',
  'Twijfelend',
  'Onrustig',
  'Gefrustreerd',
  'Kalm',
]

export async function getMonthlyReflection(
  supabase: SupabaseClient<Database>,
  userId: string,
  monthYear: string
): Promise<MonthlyReflection | null> {
  const { data, error } = await supabase
    .from('monthly_reflections')
    .select('*')
    .eq('user_id', userId)
    .eq('month_year', monthYear)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function upsertMonthlyReflection(
  supabase: SupabaseClient<Database>,
  userId: string,
  monthYear: string,
  input: Partial<MonthlyReflectionInput>
): Promise<MonthlyReflection> {
  const existing = await getMonthlyReflection(supabase, userId, monthYear)

  if (existing) {
    const { data, error } = await supabase
      .from('monthly_reflections')
      .update(input)
      .eq('id', existing.id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  const { data, error } = await supabase
    .from('monthly_reflections')
    .insert({ ...input, user_id: userId, month_year: monthYear })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function completeMonthlyReflection(
  supabase: SupabaseClient<Database>,
  id: string
): Promise<MonthlyReflection> {
  const { data, error } = await supabase
    .from('monthly_reflections')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}
