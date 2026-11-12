import { formatInTimeZone } from 'date-fns-tz'

export const AMRITSAR_TIME_ZONE = 'Asia/Kolkata'

export function formatArchiveDate(date: Date): string {
  return formatInTimeZone(date, AMRITSAR_TIME_ZONE, 'yyyy-MM-dd')
}
