import { useCallback, useEffect, useState } from 'react'
import { fetchExploreData, type ExploreData } from '../mocks/countries.ts'

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; data: ExploreData }

// Swap fetchExploreData for GET /api/countries + /api/rates once #11 lands.
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
