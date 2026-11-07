import { useState } from 'react'
import { Link } from 'react-router'
import { useExploreData } from '../hooks/useExploreData.ts'
import {
  buildRankingRows,
  END_YEAR,
  formatChange,
  formatRate,
  sortRows,
  START_YEAR,
  type SortDirection,
  type SortKey,
} from '../lib/rankings.ts'

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 dark:focus-visible:outline-teal-300'

const columns: { key: SortKey; label: string; numeric: boolean }[] = [
  { key: 'name', label: 'Country', numeric: false },
  { key: 'rate1990', label: `Rate ${START_YEAR} (%)`, numeric: true },
  { key: 'rate2022', label: `Rate ${END_YEAR} (%)`, numeric: true },
  { key: 'change', label: 'Change (percentage points)', numeric: true },
]

function RankingsPage() {
  const explore = useExploreData()
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [direction, setDirection] = useState<SortDirection>('ascending')

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setDirection((d) => (d === 'ascending' ? 'descending' : 'ascending'))
    } else {
      setSortKey(key)
      setDirection('ascending')
    }
  }

  const rows =
    explore.status === 'ready'
      ? sortRows(
          buildRankingRows(explore.data.countries, explore.data.rates),
          sortKey,
          direction,
        )
      : []
  const source =
    explore.status === 'ready' ? explore.data.rates[0]?.source : undefined
  const sortLabel = columns.find((c) => c.key === sortKey)?.label

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Rankings</h1>
      <p className="mt-2 text-slate-700 dark:text-slate-300">
        Compare every country. Select a column heading to sort the table, and
        select it again to reverse the order.
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
        // Only this box scrolls sideways on a phone, never the whole page.
        <div
          role="region"
          aria-labelledby="rankings-caption"
          tabIndex={0}
          className={`mt-8 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 ${focusRing}`}
        >
          <table className="w-full min-w-[36rem] border-collapse text-left">
            <caption
              id="rankings-caption"
              className="p-4 text-left text-sm text-slate-700 dark:text-slate-300"
            >
              Share of adults (18+) with obesity in {START_YEAR} and {END_YEAR},
              by country. Source: {source ?? 'unknown'}.
              <span className="sr-only">
                {' '}
                Sorted by {sortLabel}, {direction}.
              </span>
            </caption>
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                {columns.map((col) => {
                  const active = col.key === sortKey
                  return (
                    <th
                      key={col.key}
                      scope="col"
                      aria-sort={active ? direction : undefined}
                      className={`p-2 font-semibold ${col.numeric ? 'text-right' : ''}`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSort(col.key)}
                        className={`inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-slate-200 dark:hover:bg-slate-700 ${focusRing}`}
                      >
                        {col.label}
                        <span aria-hidden="true" className="w-3">
                          {active
                            ? direction === 'ascending'
                              ? '▲'
                              : '▼'
                            : ''}
                        </span>
                      </button>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.code}
                  className="border-t border-slate-200 dark:border-slate-700"
                >
                  <th scope="row" className="p-2 px-4 font-normal">
                    <Link
                      to={`/explore?country=${row.code}`}
                      className={`font-semibold text-teal-700 underline hover:text-teal-800 dark:text-teal-300 dark:hover:text-teal-200 ${focusRing}`}
                    >
                      {row.name}
                    </Link>
                  </th>
                  <td className="p-2 px-4 text-right tabular-nums">
                    {formatRate(row.rate1990)}
                  </td>
                  <td className="p-2 px-4 text-right tabular-nums">
                    {formatRate(row.rate2022)}
                  </td>
                  <td className="p-2 px-4 text-right tabular-nums">
                    {formatChange(row.change)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default RankingsPage
