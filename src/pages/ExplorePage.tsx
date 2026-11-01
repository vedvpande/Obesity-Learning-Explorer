import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { useExploreData } from '../hooks/useExploreData.ts'
import { buildFactSentence, latestRate } from '../lib/facts.ts'

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 dark:focus-visible:outline-teal-300'

function ExplorePage() {
  const explore = useExploreData()
  const [searchParams, setSearchParams] = useSearchParams()
  const [copyStatus, setCopyStatus] = useState('')

  const countries =
    explore.status === 'ready'
      ? [...explore.data.countries].sort((a, b) => a.name.localeCompare(b.name))
      : []
  const code = searchParams.get('country') ?? ''
  const country = countries.find((c) => c.code === code)
  const row =
    country && explore.status === 'ready'
      ? latestRate(explore.data.rates, country.code)
      : undefined
  const sentence = country && row ? buildFactSentence(country, row) : ''

  function handleChange(value: string) {
    setCopyStatus('')
    setSearchParams(value ? { country: value } : {})
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(sentence)
      setCopyStatus('Copied')
    } catch {
      setCopyStatus("Couldn't copy. Select the sentence and copy it yourself.")
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight">Look up a country</h1>
        <p className="mt-2 text-slate-700 dark:text-slate-300">
          Choose a country to see the share of adults (18+) with obesity.
        </p>

        {explore.status === 'loading' && (
          <p role="status" className="mt-8">
            Loading data…
          </p>
        )}

        {explore.status === 'error' && (
          <div role="alert" className="mt-8">
            <p>Couldn't load data. Try again.</p>
            <button
              type="button"
              onClick={explore.retry}
              className={`mt-3 rounded-lg border border-slate-400 px-4 py-2 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 ${focusRing}`}
            >
              Try again
            </button>
          </div>
        )}

        {explore.status === 'ready' && (
          <div className="mt-8">
            <label htmlFor="country" className="block font-semibold">
              Country
            </label>
            <select
              id="country"
              value={country ? country.code : ''}
              onChange={(e) => handleChange(e.target.value)}
              className={`mt-2 w-full rounded-lg border border-slate-400 bg-white px-3 py-2 sm:w-80 dark:bg-slate-800 ${focusRing}`}
            >
              <option value="">Choose a country</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>

            {sentence && (
              <section
                aria-labelledby="fact-heading"
                className="mt-8 rounded-xl border border-slate-200 p-6 dark:border-slate-700"
              >
                <h2 id="fact-heading" className="text-lg font-semibold">
                  Fact
                </h2>
                <p data-testid="fact" className="mt-2 text-lg">
                  {sentence}
                </p>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`mt-4 rounded-lg bg-teal-700 px-5 py-2 font-semibold text-white hover:bg-teal-800 ${focusRing}`}
                >
                  Copy this fact
                </button>
              </section>
            )}

            <p aria-live="polite" className="mt-3 min-h-6 text-sm">
              {copyStatus}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

export default ExplorePage
