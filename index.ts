import { appendFileSync } from 'node:fs'
import { parseArgs } from 'node:util'
import { knex } from '@gurbaninow/database'
import { formatArchiveDate } from './src/date.ts'
import { getSGPC } from './src/sgpc.ts'
import { getSikhNet } from './src/sikhnet.ts'
import { writeArchive } from './src/write-archive.ts'

const providers = {
  sgpc: { name: 'SGPC', fetchHukamnama: getSGPC },
  sikhnet: { name: 'SikhNet', fetchHukamnama: getSikhNet },
}

async function fetchLatestHukamnama(source: keyof typeof providers | undefined, force: boolean) {
  const today = formatArchiveDate(new Date())
  const sources = source ? [providers[source]] : [providers.sgpc, providers.sikhnet]

  for (const [index, { name, fetchHukamnama }] of sources.entries()) {
    console.info(`Fetching Hukamnama from ${name}${index > 0 ? ' (fallback)' : ''}...`)
    try {
      const hukamnama = await fetchHukamnama()
      const date = formatArchiveDate(hukamnama.date)
      if (!force && date !== today) {
        throw new Error(`${name} - Hukamnama not available for this day.`)
      }
      if (hukamnama.ids.length === 0 && hukamnama.sttmIds.length === 0) {
        throw new Error(`${name} - No Shabad or STTM IDs found for ${date}.`)
      }
      return { date, hukamnama }
    } catch (error) {
      console.error(error)
    }
  }

  throw new Error('Failed to fetch Hukamnama.')
}

try {
  const {
    values: { source, force },
  } = parseArgs({
    options: {
      source: { type: 'string' },
      force: { type: 'boolean', default: false },
    },
  })
  if (source !== undefined && source !== 'sgpc' && source !== 'sikhnet') {
    throw new Error('--source must be sgpc or sikhnet.')
  }

  const { date, hukamnama } = await fetchLatestHukamnama(source, force)
  console.info('Writing Hukamnama to file...')
  writeArchive(date, hukamnama, force)
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `date=${date}\n`)
  }
  console.info('Exiting...')
} finally {
  await knex.destroy()
}
