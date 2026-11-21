// The small parts of the Google Identity Services and Cloudflare Turnstile
// browser APIs that the login page uses. Both load as <script> tags.

type TurnstileOptions = {
  sitekey: string
  callback: (token: string) => void
  'expired-callback'?: () => void
  'error-callback'?: () => void
  theme?: 'auto' | 'light' | 'dark'
}

type GoogleCredentialResponse = { credential: string }

interface Window {
  turnstile?: {
    render: (container: HTMLElement, options: TurnstileOptions) => string
    reset: (widgetId?: string) => void
    remove: (widgetId?: string) => void
  }
  google?: {
    accounts: {
      id: {
        initialize: (options: {
          client_id: string
          callback: (response: GoogleCredentialResponse) => void
        }) => void
        renderButton: (
          parent: HTMLElement,
          options: { theme?: string; size?: string; text?: string },
        ) => void
      }
    }
  }
}
