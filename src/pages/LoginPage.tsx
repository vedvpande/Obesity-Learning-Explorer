import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { signInWithGoogle } from '../api/client.ts'
import { safeNext, useAuth } from '../auth/auth.ts'
import { loadScript } from '../lib/loadScript.ts'

const TURNSTILE_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
const GOOGLE_SRC = 'https://accounts.google.com/gsi/client'

// Step 1: the Turnstile "are you human?" check.
// Step 2: once it passes, the official Sign in with Google button appears.
// Both tokens go to POST /api/auth/google, which checks them on the server.
function LoginPage() {
  const { status, refresh } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))

  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const configured = Boolean(siteKey && clientId)

  const turnstileBox = useRef<HTMLDivElement>(null)
  const googleBox = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | undefined>(undefined)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Show the Turnstile widget.
  useEffect(() => {
    if (!siteKey || !clientId || status !== 'signedOut') return
    let cancelled = false
    loadScript(TURNSTILE_SRC)
      .then(() => {
        if (cancelled || !turnstileBox.current || !window.turnstile) return
        widgetId.current = window.turnstile.render(turnstileBox.current, {
          sitekey: siteKey,
          theme: 'auto',
          callback: (token) => {
            setTurnstileToken(token)
            setError('')
          },
          'expired-callback': () => setTurnstileToken(null),
          'error-callback': () =>
            setError("The human check couldn't load. Please reload the page."),
        })
      })
      .catch(() =>
        setError("The human check couldn't load. Please reload the page."),
      )
    return () => {
      cancelled = true
      if (widgetId.current) window.turnstile?.remove(widgetId.current)
      widgetId.current = undefined
    }
  }, [siteKey, clientId, status])

  // After Turnstile passes, show the Google button.
  useEffect(() => {
    if (!turnstileToken || !clientId) return
    let cancelled = false
    loadScript(GOOGLE_SRC)
      .then(() => {
        if (cancelled || !googleBox.current || !window.google) return
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async ({ credential }) => {
            setMessage('Signing you in…')
            setError('')
            try {
              await signInWithGoogle(credential, turnstileToken)
              await refresh()
              navigate(next, { replace: true })
            } catch (err) {
              setMessage('')
              setError(
                `${err instanceof Error ? err.message : "Sign-in didn't work."} Please complete the check again.`,
              )
              // A Turnstile token can only be used once.
              setTurnstileToken(null)
              window.turnstile?.reset(widgetId.current)
            }
          },
        })
        window.google.accounts.id.renderButton(googleBox.current, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
        })
      })
      .catch(() =>
        setError("Google sign-in couldn't load. Please reload the page."),
      )
    return () => {
      cancelled = true
    }
  }, [turnstileToken, clientId, refresh, navigate, next])

  if (status === 'signedIn') return <Navigate to={next} replace />

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Sign in</h1>
      <p className="mt-2 text-slate-700 dark:text-slate-300">
        Sign in with your Google account to save facts to My Report. We only
        keep your name and email, never health information.
      </p>

      {!configured && (
        <p role="alert" className="mt-8">
          Sign-in isn't set up on this site yet.
        </p>
      )}

      {configured && status === 'loading' && (
        <p role="status" className="mt-8">
          Checking sign-in…
        </p>
      )}

      {configured && status === 'signedOut' && (
        <>
          <section aria-labelledby="human-check" className="mt-8">
            <h2 id="human-check" className="text-lg font-semibold">
              1. Quick human check
            </h2>
            <div ref={turnstileBox} data-testid="turnstile" className="mt-3" />
          </section>

          <section aria-labelledby="google-step" className="mt-8">
            <h2 id="google-step" className="text-lg font-semibold">
              2. Sign in with Google
            </h2>
            {turnstileToken ? (
              <div
                ref={googleBox}
                data-testid="google-button"
                className="mt-3"
              />
            ) : (
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                Complete the human check first.
              </p>
            )}
          </section>
        </>
      )}

      <p aria-live="polite" className="mt-6 min-h-6 text-sm">
        {message}
      </p>
      {error && (
        <p role="alert" className="mt-2 text-sm">
          {error}
        </p>
      )}
    </div>
  )
}

export default LoginPage
