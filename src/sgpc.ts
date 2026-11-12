import { Lines } from '@gurbaninow/database'
import gurmukhiUtils from 'gurmukhi-utils'
import { parseSGPCHtml } from './sgpc-html.ts'
import type { Hukamnama } from './types.ts'

const { firstLetters, stripEndings, toAscii, toUnicode } = gurmukhiUtils

export async function getSGPC(): Promise<Hukamnama> {
  const response = await fetch('https://hs.sgpc.net/index.php')
  if (!response.ok) {
    throw new Error(`SGPC - HTTP ${response.status} ${response.statusText}`)
  }

  const { mukhvaak, page, date } = parseSGPCHtml(await response.text())
  const searchTerms = mukhvaak
    .map((line) => toAscii(firstLetters(stripEndings(toUnicode(line)))))
    .filter((letters) => letters.length > 3)
    .toReversed()

  // Search SGGS only, on the printed ang and the following ang.
  const query = Lines.query()
    .join('line_content', 'line_content.line_id', 'lines.id')
    .join('shabads', 'shabads.id', 'lines.shabad_id')
    .whereIn('lines.source_page', [page, page + 1])
    .andWhere('shabads.composition_id', 1)

  const matches = await Promise.all(
    searchTerms.map((letters) =>
      query.clone().genericSearch(letters, 'line_content.first_letters', true, false, false),
    ),
  )
  const bestMatches = matches.map(([first]) => first).filter((match) => match !== undefined)
  const uniqueMatches = new Map(
    bestMatches.map(({ shabadId, sttmId, orderId }) => [
      JSON.stringify([shabadId, sttmId, orderId]),
      { shabadId, sttmId, orderId },
    ]),
  )
  const shabads = [...uniqueMatches.values()].sort((a, b) => a.orderId - b.orderId)

  // A multi-shabad Hukamnama must match consecutive shabads (e.g. saloks and their pauri).
  if (
    !shabads.every(({ orderId }, index) => {
      const previous = shabads[index - 1]
      return !previous || orderId === previous.orderId + 1
    })
  ) {
    throw new RangeError('SGPC - Shabads found not consecutive.')
  }

  return {
    date,
    ids: shabads.map(({ shabadId }) => shabadId),
    sttmIds: shabads.map(({ sttmId }) => sttmId),
  }
}
