'use client'

import * as React from 'react'
import { Menu } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { SidebarNav } from '@/components/layout/sidebar-nav'

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function Header({ userLabel }: { userLabel: string }) {
  const router = useRouter()
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="flex h-16 w-full items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-2">
        <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileNavOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menu openen</span>
          </Button>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Navigatie</SheetTitle>
            <SidebarNav onNavigate={() => setIsMobileNavOpen(false)} />
          </SheetContent>
        </Sheet>
        <span className="text-lg font-semibold tracking-tight">Trading OS</span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="rounded-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            <Avatar>
              <AvatarFallback>{getInitials(userLabel)}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{userLabel}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>Uitloggen</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
