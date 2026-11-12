import { isValid, parse } from 'date-fns'
import { fromZonedTime } from 'date-fns-tz'
import gurmukhiUtils from 'gurmukhi-utils'
import { JSDOM } from 'jsdom'
import { AMRITSAR_TIME_ZONE } from './date.ts'

const { isGurmukhi, toAscii } = gurmukhiUtils

export function parseSGPCHtml(html: string) {
  const { window } = new JSDOM(html)
  try {
    const { document } = window
    const rawMukhvaak = document.querySelector('.hukamnama-text')?.textContent.trim()
    if (!rawMukhvaak) {
      throw new Error('SGPC - Could not extract Hukamnama text')
    }

    const text = rawMukhvaak.replace(/[\r\n\t]/g, '').replace(/\s+/g, ' ')
    const mukhvaak = (isGurmukhi(text) ? toAscii(text) : text)
      .replace(/\]\s?(\d+)\s?\]/g, ']$1]')
      .replace(/\](?!\d+|\s?rhwau)/g, ']\n')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    const dateFields = Array.from(document.querySelectorAll('.customDate'), (el) => el.textContent)
    const findMatch = (pattern: RegExp) =>
      dateFields.map((field) => pattern.exec(field)?.[1]).find((match) => match !== undefined)

    const rawPage = findMatch(/\((?:ਅੰਗ|Ang|Page)\s*:?\s*(\d+|[੦-੯]+)\)/u)
    const page = Number(rawPage && (isGurmukhi(rawPage) ? toAscii(rawPage) : rawPage))
    if (!Number.isInteger(page) || page < 1) {
      throw new Error('SGPC - Could not extract page number from available elements')
    }

    const rawDate = findMatch(/\b(\d{1,2}-\d{1,2}-\d{4})\b/)
    if (!rawDate) {
      throw new Error('SGPC - Could not extract date from available elements')
    }
    const date = fromZonedTime(parse(rawDate, 'dd-MM-yyyy', new Date()), AMRITSAR_TIME_ZONE)
    if (!isValid(date)) {
      throw new Error(`SGPC - Invalid Hukamnama date: ${rawDate}`)
    }

    return { mukhvaak, page, date }
  } finally {
    window.close()
  }
}
