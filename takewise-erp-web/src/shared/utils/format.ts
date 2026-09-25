const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

// Formats an ISO date string for display, e.g. "12 Mar 2024"
export function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date)
}