// Public settings baked into the website at build time (VITE_ prefix).
// Never put a secret in a VITE_ variable: everyone can read it.
interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID?: string
  readonly VITE_TURNSTILE_SITE_KEY?: string
}
