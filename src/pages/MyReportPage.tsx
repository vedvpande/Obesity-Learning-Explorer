import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/auth.ts'
import { buildCitation, buildCitationList } from '../lib/facts.ts'
import {
  deleteSavedFact,
  getSavedFacts,
  type SavedFact,
} from '../mocks/savedFacts.ts'

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 dark:focus-visible:outline-teal-300'
const linkClass = `font-semibold text-teal-700 underline hover:text-teal-800 dark:text-teal-300 dark:hover:text-teal-200 ${focusRing}`

function MyReportPage() {
  const { user, signIn } = useAuth()
  const [facts, setFacts] = useState<SavedFact[] | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!user) return
    let cancelled = false
    getSavedFacts(user).then(
      (list) => {
        if (!cancelled) setFacts(list)
      },
      () => {
        if (!cancelled) setFacts([])
      },
    )
    return () => {
      cancelled = true
    }
  }, [user])

  async function handleDelete(fact: SavedFact) {
    try {
      await deleteSavedFact(user, fact.id)
      setFacts((list) => list?.filter((f) => f.id !== fact.id) ?? null)
      setMessage(`Deleted ${fact.countryName}, ${fact.year}.`)
    } catch {
      setMessage("Couldn't delete that fact. Try again.")
    }
  }

  async function handleCopyAll() {
    try {
      await navigator.clipboard.writeText(buildCitationList(facts ?? []))
      setMessage(`Copied ${facts?.length ?? 0} citations.`)
    } catch {
      setMessage("Couldn't copy. Select the citations and copy them yourself.")
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">My Report</h1>
      <p className="mt-2 text-slate-700 dark:text-slate-300">
        Facts you have saved, with their sources, ready to cite.
      </p>

      {!user && (
        <div className="mt-8">
          <p>Sign in to see the facts you have saved.</p>
          <button
            type="button"
            onClick={signIn}
            className={`mt-3 rounded-lg border border-slate-400 px-4 py-2 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 ${focusRing}`}
          >
            Sign in (demo)
          </button>
        </div>
      )}

      {user && facts === null && (
        <p role="status" className="mt-8">
          Loading your saved facts…
        </p>
      )}

      {user && facts?.length === 0 && (
        <p className="mt-8">
          You haven't saved any facts yet.{' '}
          <Link to="/explore" className={linkClass}>
            Look up a country
          </Link>{' '}
          and choose "Save to My Report".
        </p>
      )}

      {user && facts && facts.length > 0 && (
        <>
          <button
            type="button"
            onClick={handleCopyAll}
            className={`mt-8 rounded-lg bg-teal-700 px-5 py-2 font-semibold text-white hover:bg-teal-800 ${focusRing}`}
          >
            Copy all citations
          </button>
          <ul className="mt-6 space-y-4">
            {facts.map((fact) => (
              <li
                key={fact.id}
                className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
              >
                <p>{buildCitation(fact)}</p>
                {fact.note && (
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                    Note: {fact.note}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(fact)}
                  aria-label={`Delete ${fact.countryName}, ${fact.year}`}
                  className={`mt-3 rounded-lg border border-slate-400 px-3 py-1.5 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 ${focusRing}`}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <p aria-live="polite" className="mt-4 min-h-6 text-sm">
        {message}
      </p>
    </div>
  )
}

export default MyReportPage
