const localDateTimePattern = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})/
const offsetPattern = /(Z|[+-]\d{2}:?\d{2})$/i

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '-'

  const localMatch = value.match(localDateTimePattern)
  if (localMatch && !offsetPattern.test(value)) return `${localMatch[1]} ${localMatch[2]}`

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value

  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(parsed)
}
