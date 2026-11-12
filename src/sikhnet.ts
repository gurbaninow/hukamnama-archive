import { Shabads } from '@gurbaninow/database'
import { isValid, parse } from 'date-fns'
import { fromZonedTime } from 'date-fns-tz'
import { XMLParser } from 'fast-xml-parser'
import { AMRITSAR_TIME_ZONE } from './date.ts'
import type { Hukamnama } from './types.ts'

export async function getSikhNet(): Promise<Hukamnama> {
  const response = await fetch('https://www.sikhnet.com/webapps/gmcws/hukam.php')
  if (!response.ok) {
    throw new Error(`SikhNet - HTTP ${response.status} ${response.statusText}`)
  }

  const payload: unknown = new XMLParser().parse(await response.text())
  if (!payload || typeof payload !== 'object' || !('results' in payload)) {
    throw new Error('SikhNet - Missing results')
  }
  const { results } = payload
  if (!results || typeof results !== 'object') {
    throw new Error('SikhNet - Invalid results')
  }
  if ('error' in results && typeof results.error === 'string' && results.error) {
    throw new Error(`SikhNet - ${results.error}`)
  }
  if (!('hukam_date' in results) || typeof results.hukam_date !== 'string') {
    throw new Error('SikhNet - Missing Hukamnama date')
  }
  if (
    !('sids' in results) ||
    (typeof results.sids !== 'number' && typeof results.sids !== 'string')
  ) {
    throw new Error('SikhNet - Missing shabad IDs')
  }

  const date = fromZonedTime(
    parse(results.hukam_date, 'yyyy-MM-dd HH:mm:ss', new Date()),
    AMRITSAR_TIME_ZONE,
  )
  if (!isValid(date)) {
    throw new Error(`SikhNet - Invalid Hukamnama date: ${results.hukam_date}`)
  }
  const sttmIds =
    typeof results.sids === 'string' ? results.sids.split(',').map(Number) : [results.sids]
  if (sttmIds.some((id) => !Number.isSafeInteger(id) || id < 1)) {
    throw new Error('SikhNet - Invalid shabad IDs')
  }

  const shabads = await Shabads.query().select('id').whereIn('sttm_id', sttmIds).orderBy('order_id')
  return { date, ids: shabads.map(({ id }) => id), sttmIds }
}
