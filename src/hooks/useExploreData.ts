import { useCallback, useEffect, useState } from 'react'
import { fetchExploreData } from '../api/client.ts'
import type { ExploreData } from '../api/types.ts'

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; data: ExploreData }

// Loads every country with its 1990 and 2022 rates from the API.
export function useExploreData() {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetchExploreData().then(
      (data) => {
        if (!cancelled) setState({ status: 'ready', data })
      },
      () => {
        if (!cancelled) setState({ status: 'error' })
      },
    )
    return () => {
      cancelled = true
    }
  }, [attempt])

  const retry = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }, [])

  return { ...state, retry }
}
