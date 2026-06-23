import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, avatar_url, email')
    .eq('user_id', user.id)
    .single()

  const userLabel = profile?.name ?? profile?.email ?? user.email ?? 'Gebruiker'

  return (
    <div className="flex min-h-screen flex-col">
      <Header userLabel={userLabel} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  )
}
