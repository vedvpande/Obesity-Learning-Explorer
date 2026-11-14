import {
  deleteSavedFact,
  getSavedFacts,
  resetSavedFacts,
  saveFact,
  type MockUser,
} from './savedFacts.ts'

const priya: MockUser = { id: 'priya', name: 'Priya' }
const sam: MockUser = { id: 'sam', name: 'Sam' }

const fact = (countryCode: string, countryName: string) => ({
  countryCode,
  countryName,
  year: 2022,
  ratePercent: 20,
  source: 'Mock source',
  note: '',
})

beforeEach(() => {
  resetSavedFacts()
})

test('every action returns 401 when signed out', async () => {
  await expect(getSavedFacts(null)).rejects.toMatchObject({ status: 401 })
  await expect(saveFact(null, fact('GBR', 'UK'))).rejects.toMatchObject({
    status: 401,
  })
  await expect(deleteSavedFact(null, '1')).rejects.toMatchObject({
    status: 401,
  })
})

test('bad input returns 400 and saves nothing', async () => {
  await expect(
    saveFact(priya, { ...fact('GBR', 'UK'), year: 1800 }),
  ).rejects.toMatchObject({ status: 400 })
  await expect(
    saveFact(priya, { ...fact('GBR', 'UK'), note: 'a'.repeat(281) }),
  ).rejects.toMatchObject({ status: 400 })
  expect(await getSavedFacts(priya)).toEqual([])
})

test('lists saved facts newest first', async () => {
  await saveFact(priya, fact('GBR', 'United Kingdom'))
  await saveFact(priya, fact('FRA', 'France'))
  const list = await getSavedFacts(priya)
  expect(list.map((f) => f.countryName)).toEqual(['France', 'United Kingdom'])
  expect(list.every((f) => f.userId === 'priya')).toBe(true)
})

test('two accounts each see only their own facts', async () => {
  await saveFact(priya, fact('GBR', 'United Kingdom'))
  await saveFact(sam, fact('FRA', 'France'))
  expect((await getSavedFacts(priya)).map((f) => f.countryCode)).toEqual([
    'GBR',
  ])
  expect((await getSavedFacts(sam)).map((f) => f.countryCode)).toEqual(['FRA'])
})

test("deleting someone else's fact returns 404 and keeps it", async () => {
  const samsFact = await saveFact(sam, fact('FRA', 'France'))
  await expect(deleteSavedFact(priya, samsFact.id)).rejects.toMatchObject({
    status: 404,
  })
  expect(await getSavedFacts(sam)).toHaveLength(1)
})

test('deleting your own fact removes it; deleting again returns 404', async () => {
  const saved = await saveFact(priya, fact('GBR', 'United Kingdom'))
  await deleteSavedFact(priya, saved.id)
  expect(await getSavedFacts(priya)).toEqual([])
  await expect(deleteSavedFact(priya, saved.id)).rejects.toMatchObject({
    status: 404,
  })
})
