import { mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Hukamnama } from './types.ts'

export function writeArchive(date: string, { ids, sttmIds }: Hukamnama, force = false) {
  const [year, month, day] = date.split('-')
  const folder = new URL(`../archive/${year}/${month}/`, import.meta.url)
  mkdirSync(folder, { recursive: true })

  const file = new URL(`${day}.json`, folder)
  const data = `${JSON.stringify({ sttm2_ids: sttmIds, shabad_ids: ids }, null, 2)}\n`
  if (force) {
    // Write alongside the archive so the rename can replace it atomically.
    const temporaryFolder = mkdtempSync(fileURLToPath(new URL('.fetch-', folder)))
    try {
      const temporaryFile = join(temporaryFolder, 'hukamnama.json')
      writeFileSync(temporaryFile, data)
      renameSync(temporaryFile, file)
    } finally {
      rmSync(temporaryFolder, { recursive: true, force: true })
    }
    return
  }

  try {
    writeFileSync(file, data, { flag: 'wx' })
  } catch (error) {
    if (!(error instanceof Error) || !('code' in error) || error.code !== 'EEXIST') {
      throw error
    }
    console.info('Archive file already exists. Checking if the data matches...')
    if (readFileSync(file, 'utf8') !== data) {
      throw new Error('File - Fetched data does not match existing written file.')
    }
    console.info('Files match!')
  }
}
