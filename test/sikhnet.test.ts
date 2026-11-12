import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { knex } from '@gurbaninow/database'
import { getSikhNet } from '../src/sikhnet.ts'

after(() => knex.destroy())

const sikhNetResponse = (ids: string) =>
  new Response(`<results><hukam_date>2026-11-11 00:00:00</hukam_date><sids>${ids}</sids></results>`)

test('resolves the archived SikhNet shabad', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => sikhNetResponse('2591'))

  const { ids, sttmIds } = await getSikhNet()
  assert.deepEqual(ids, ['GPC'])
  assert.deepEqual(sttmIds, [2591])
})

test('preserves SikhNet STTM IDs that do not have a database match', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => sikhNetResponse('2591,99999999'))

  const { ids, sttmIds } = await getSikhNet()
  assert.deepEqual(ids, ['GPC'])
  assert.deepEqual(sttmIds, [2591, 99999999])
})
