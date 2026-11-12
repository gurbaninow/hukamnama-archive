import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatArchiveDate } from '../src/date.ts'
import { parseSGPCHtml } from '../src/sgpc-html.ts'

function sgpcHtml(dateText: string): string {
  return `<p class="customDate">${dateText}</p>
    <p class="customDate">(ਅੰਗ: ੬੮੦)</p>
    <p class="hukamnama-text">ਧਨਾਸਰੀ ਮਹਲਾ ੫ ॥</p>`
}

test('extracts the date and ang from an SGPC page with a timestamp', () => {
  const { date, page } = parseSGPCHtml(sgpcHtml('11-11-2026  05:30 AM'))
  assert.equal(page, 680)
  assert.equal(date.toISOString(), '2026-11-10T18:30:00.000Z')
  assert.equal(formatArchiveDate(date), '2026-11-11')
})

test('rejects an invalid SGPC date before querying for the shabad', () => {
  assert.throws(
    () => parseSGPCHtml(sgpcHtml('31-02-2026 05:30 AM')),
    /SGPC - Invalid Hukamnama date: 31-02-2026/,
  )
})

test('rolls over the archive date at midnight in Amritsar', () => {
  assert.equal(formatArchiveDate(new Date('2026-11-11T18:29:59Z')), '2026-11-11')
  assert.equal(formatArchiveDate(new Date('2026-11-11T18:30:00Z')), '2026-11-12')
})
