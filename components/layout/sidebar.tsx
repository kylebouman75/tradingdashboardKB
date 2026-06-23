import { SidebarNav } from '@/components/layout/sidebar-nav'

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-secondary/30 md:flex md:flex-col">
      <SidebarNav />
    </aside>
  )
}
