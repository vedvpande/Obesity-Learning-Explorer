import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/auth.ts'
import { NOTE_MAX_LENGTH } from '../lib/savedFactInput.ts'
import type { Country, RateRow } from '../mocks/countries.ts'
import { saveFact } from '../mocks/savedFacts.ts'

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 dark:focus-visible:outline-teal-300'

type Props = { country: Country; row: RateRow }

function SaveFactForm({ country, row }: Props) {
  const { user, signIn } = useAuth()
  const [note, setNote] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle',
  )
  const [error, setError] = useState('')

  if (!user) {
    return (
      <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-700">
        <p>Sign in to save this fact to My Report.</p>
        <button
          type="button"
          onClick={signIn}
          className={`mt-2 rounded-lg border border-slate-400 px-4 py-2 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 ${focusRing}`}
        >
          Sign in (demo)
        </button>
      </div>
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus('saving')
    try {
      await saveFact(user, {
        countryCode: country.code,
        countryName: country.name,
        year: row.year,
        ratePercent: row.ratePercent,
        source: row.source,
        note,
      })
      setNote('')
      setStatus('saved')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setStatus('error')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-700"
    >
      <label htmlFor="fact-note" className="block font-semibold">
        Note (optional)
      </label>
      <textarea
        id="fact-note"
        value={note}
        maxLength={NOTE_MAX_LENGTH}
        rows={2}
        aria-describedby="fact-note-hint fact-note-count"
        onChange={(e) => {
          setNote(e.target.value)
          if (status !== 'saving') setStatus('idle')
        }}
        className={`mt-2 w-full rounded-lg border border-slate-400 bg-white px-3 py-2 dark:bg-slate-800 ${focusRing}`}
      />
      <div className="mt-1 flex justify-between gap-4 text-sm text-slate-700 dark:text-slate-300">
        <p id="fact-note-hint">Don't include personal health information.</p>
        <p id="fact-note-count">
          {note.length}/{NOTE_MAX_LENGTH}
        </p>
      </div>
      <button
        type="submit"
        disabled={status === 'saving'}
        className={`mt-3 rounded-lg border border-teal-700 px-5 py-2 font-semibold text-teal-800 hover:bg-teal-50 disabled:opacity-60 dark:border-teal-300 dark:text-teal-200 dark:hover:bg-slate-800 ${focusRing}`}
      >
        Save to My Report
      </button>
      <p aria-live="polite" className="mt-2 min-h-6 text-sm">
        {status === 'saved' && (
          <>
            Saved to My Report.{' '}
            <Link
              to="/my-report"
              className={`font-semibold text-teal-700 underline dark:text-teal-300 ${focusRing}`}
            >
              View My Report
            </Link>
          </>
        )}
        {status === 'error' && `Couldn't save: ${error}`}
      </p>
    </form>
  )
}

export default SaveFactForm
