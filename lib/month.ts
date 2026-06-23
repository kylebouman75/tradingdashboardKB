function toIso(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function getMonthYearNow(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function shiftMonth(monthYear: string, months: number): string {
  const [year, month] = monthYear.split('-').map(Number)
  const date = new Date(year, month - 1 + months, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function getMonthDateRange(monthYear: string): { from: string; to: string } {
  const [year, month] = monthYear.split('-').map(Number)
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  return { from: toIso(firstDay), to: toIso(lastDay) }
}

export function formatMonthYearNL(monthYear: string): string {
  const [year, month] = monthYear.split('-').map(Number)
  const date = new Date(year, month - 1, 1)
  return new Intl.DateTimeFormat('nl-NL', { month: 'long', year: 'numeric' }).format(date)
}
