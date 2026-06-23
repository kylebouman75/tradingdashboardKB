'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'

type NavItem = {
  label: string
  href: string
}

type NavSection = {
  label: string
  items: NavItem[]
}

const sections: NavSection[] = [
  {
    label: 'Trading',
    items: [
      { label: 'Pre-Market', href: '/trading/pre-market' },
      { label: 'Trade Log', href: '/trading/trade-log' },
      { label: 'Post-Market', href: '/trading/post-market' },
    ],
  },
  {
    label: 'Reviews',
    items: [
      { label: 'Daily Review', href: '/reviews/daily-review' },
      { label: 'Game Day', href: '/reviews/game-day' },
      { label: 'Weekly Reflectie', href: '/reviews/weekly-reflection' },
      { label: 'Weekly Review', href: '/reviews/weekly-review' },
      { label: 'Maandelijkse Reflectie', href: '/reviews/monthly-reflection' },
      { label: 'Monthly Review', href: '/reviews/monthly-review' },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { label: 'Performance Dashboard', href: '/analytics/overview' },
      { label: 'Psychology', href: '/analytics/psychology' },
      { label: 'Heatmaps', href: '/analytics/heatmaps' },
      { label: 'Trends', href: '/analytics/trends' },
      { label: 'Strategie Prestaties', href: '/analytics/strategy-performance' },
      { label: 'P&L Kalender', href: '/analytics/pl-calendar' },
    ],
  },
  {
    label: 'Libraries',
    items: [
      { label: 'Strategy Library', href: '/libraries/strategy-library' },
      { label: 'Trader Identity Hub', href: '/libraries/trader-identity-hub' },
    ],
  },
  {
    label: 'Research',
    items: [{ label: 'Backtest', href: '/research/backtest' }],
  },
]

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>(
    () => Object.fromEntries(sections.map((section) => [section.label, true]))
  )

  function toggleSection(label: string) {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  function isItemActive(href: string) {
    return pathname === href
  }

  function isSectionActive(section: NavSection) {
    return section.items.some((item) => isItemActive(item.href))
  }

  return (
    <nav className="flex flex-col gap-1 p-4">
      <Link
        href="/overview"
        onClick={onNavigate}
        className={cn(
          'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent',
          isItemActive('/overview')
            ? 'bg-blue-500/10 text-blue-500'
            : 'text-foreground'
        )}
      >
        Overview
      </Link>

      {sections.map((section) => {
        const isOpen = openSections[section.label]
        const sectionActive = isSectionActive(section)

        return (
          <div key={section.label}>
            <button
              type="button"
              onClick={() => toggleSection(section.label)}
              className={cn(
                'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-semibold transition-colors hover:bg-accent',
                sectionActive ? 'text-blue-500' : 'text-foreground'
              )}
            >
              {section.label}
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform',
                  isOpen && 'rotate-180'
                )}
              />
            </button>
            {isOpen && (
              <div className="flex flex-col gap-1">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      'rounded-md px-3 py-2 pl-6 text-sm transition-colors hover:bg-accent',
                      isItemActive(item.href)
                        ? 'bg-blue-500/10 text-blue-500'
                        : 'text-muted-foreground'
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )
      })}

      <Link
        href="/settings"
        onClick={onNavigate}
        className={cn(
          'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent',
          isItemActive('/settings') ? 'bg-blue-500/10 text-blue-500' : 'text-foreground'
        )}
      >
        Settings
      </Link>
    </nav>
  )
}
