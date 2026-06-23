function toIso(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function getWeekStartDate(date: Date): Date {
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(date)
  monday.setDate(date.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

export function getWeekStartIso(date: Date = new Date()): string {
  return toIso(getWeekStartDate(date))
}

export function getWeekEndIso(weekStartIso: string): string {
  const start = new Date(`${weekStartIso}T00:00:00`)
  start.setDate(start.getDate() + 6)
  return toIso(start)
}

export function shiftWeek(weekStartIso: string, weeks: number): string {
  const start = new Date(`${weekStartIso}T00:00:00`)
  start.setDate(start.getDate() + weeks * 7)
  return toIso(start)
}

export function formatWeekRangeNL(weekStartIso: string): string {
  const start = new Date(`${weekStartIso}T00:00:00`)
  const end = new Date(`${getWeekEndIso(weekStartIso)}T00:00:00`)

  const dayFormatter = new Intl.DateTimeFormat('nl-NL', { day: 'numeric' })
  const monthFormatter = new Intl.DateTimeFormat('nl-NL', { month: 'long' })
  const yearFormatter = new Intl.DateTimeFormat('nl-NL', { year: 'numeric' })

  const startDay = dayFormatter.format(start)
  const endDay = dayFormatter.format(end)
  const startMonth = monthFormatter.format(start)
  const endMonth = monthFormatter.format(end)
  const endYear = yearFormatter.format(end)

  const monthLabel = startMonth === endMonth ? endMonth : `${startMonth} – ${endMonth}`

  return `Week van ${startDay} – ${endDay} ${monthLabel} ${endYear}`
}
