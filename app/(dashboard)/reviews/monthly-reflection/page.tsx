import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { getMonthYearNow } from '@/lib/month'
import { MonthNavigator } from '@/components/shared/month-navigator'
import { MonthlyReflectionForm } from '@/components/reviews/monthly-reflection/monthly-reflection-form'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function MonthlyReflectionRoute({
  searchParams,
}: {
  searchParams: { month?: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const monthYear = searchParams.month ?? getMonthYearNow()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Maandelijkse Reflectie</h1>
        <MonthNavigator monthYear={monthYear} />
      </div>

      <MonthlyReflectionForm key={monthYear} monthYear={monthYear} />
    </div>
  )
}
