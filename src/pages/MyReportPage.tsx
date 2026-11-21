import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import {
  ApiError,
  deleteSavedFact,
  listSavedFacts,
  updateSavedFactNote,
} from '../api/client.ts'
import type { SavedFact } from '../api/types.ts'
import { useAuth } from '../auth/auth.ts'
import { buildCitation, buildCitationList } from '../lib/facts.ts'
import { NOTE_MAX_LENGTH } from '../lib/savedFactInput.ts'

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 dark:focus-visible:outline-teal-300'
const linkClass = `font-semibold text-teal-700 underline hover:text-teal-800 dark:text-teal-300 dark:hover:text-teal-200 ${focusRing}`
const smallButton = `mt-3 rounded-lg border border-slate-400 px-3 py-1.5 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 ${focusRing}`

function MyReportPage() {
  // RequireAuth makes sure we're signed in before this page shows.
  const { user, refresh } = useAuth()
  const [facts, setFacts] = useState<SavedFact[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [message, setMessage] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    if (!user) return
    let cancelled = false
    listSavedFacts().then(
      (list) => {
        if (!cancelled) setFacts(list)
      },
      (err: unknown) => {
        if (cancelled) return
        // Session ended (e.g. after 7 days): update the sign-in state, and
        // RequireAuth sends the user to the login page.
        if (err instanceof ApiError && err.status === 401) void refresh()
        else setLoadFailed(true)
      },
    )
    return () => {
      cancelled = true
    }
  }, [user, attempt, refresh])

  function retry() {
    setLoadFailed(false)
    setFacts(null)
    setAttempt((n) => n + 1)
  }

  async function handleDelete(fact: SavedFact) {
    try {
      await deleteSavedFact(fact.id)
      setFacts((list) => list?.filter((f) => f.id !== fact.id) ?? null)
      setMessage(`Deleted ${fact.countryName}, ${fact.year}.`)
    } catch {
      setMessage("Couldn't delete that fact. Try again.")
    }
  }

  function startEdit(fact: SavedFact) {
    setEditingId(fact.id)
    setDraft(fact.note)
    setMessage('')
  }

  async function handleSaveNote(e: FormEvent, fact: SavedFact) {
    e.preventDefault()
    try {
      const { note } = await updateSavedFactNote(fact.id, draft)
      setFacts(
        (list) =>
          list?.map((f) => (f.id === fact.id ? { ...f, note } : f)) ?? null,
      )
      setEditingId(null)
      setMessage(`Note saved for ${fact.countryName}, ${fact.year}.`)
    } catch (err) {
      setMessage(
        `Couldn't save the note: ${err instanceof Error ? err.message : 'try again.'}`,
      )
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

      {user && loadFailed && (
        <div role="alert" className="mt-8">
          <p>Couldn't load your saved facts.</p>
          <button type="button" onClick={retry} className={smallButton}>
            Try again
          </button>
        </div>
      )}

      {user && !loadFailed && facts === null && (
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

                {editingId === fact.id ? (
                  <form
                    onSubmit={(e) => handleSaveNote(e, fact)}
                    className="mt-3"
                  >
                    <label
                      htmlFor={`note-${fact.id}`}
                      className="block text-sm font-semibold"
                    >
                      Note for {fact.countryName}, {fact.year}
                    </label>
                    <textarea
                      id={`note-${fact.id}`}
                      value={draft}
                      maxLength={NOTE_MAX_LENGTH}
                      rows={2}
                      aria-describedby={`note-${fact.id}-hint`}
                      onChange={(e) => setDraft(e.target.value)}
                      className={`mt-1 w-full rounded-lg border border-slate-400 bg-white px-3 py-2 dark:bg-slate-800 ${focusRing}`}
                    />
                    <p
                      id={`note-${fact.id}-hint`}
                      className="mt-1 text-sm text-slate-700 dark:text-slate-300"
                    >
                      Don't include personal health information. {draft.length}/
                      {NOTE_MAX_LENGTH}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button type="submit" className={smallButton}>
                        Save note
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className={smallButton}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    {fact.note && (
                      <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                        Note: {fact.note}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(fact)}
                        aria-label={`Edit note for ${fact.countryName}, ${fact.year}`}
                        className={smallButton}
                      >
                        Edit note
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(fact)}
                        aria-label={`Delete ${fact.countryName}, ${fact.year}`}
                        className={smallButton}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
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
