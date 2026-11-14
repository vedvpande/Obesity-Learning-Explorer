import { Link, NavLink, Outlet } from 'react-router'
import { useAuth } from '../auth/auth.ts'
import ThemeToggle from './ThemeToggle.tsx'

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 dark:focus-visible:outline-teal-300'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/explore', label: 'Explore' },
  { to: '/rankings', label: 'Rankings' },
  { to: '/learn', label: 'Learn' },
  { to: '/about', label: 'About' },
  { to: '/my-report', label: 'My Report' },
]

function Layout() {
  const { user, signIn, signOut } = useAuth()

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <a
        href="#main"
        className={`sr-only rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white focus:not-sr-only focus:absolute focus:top-2 focus:left-2 ${focusRing}`}
      >
        Skip to main content
      </a>

      <header className="border-b border-slate-200 dark:border-slate-700">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <Link to="/" className={`rounded font-bold ${focusRing}`}>
            Obesity Learning Explorer
          </Link>
          {/* On phones: name and toggle on the first row, menu below. */}
          <nav
            aria-label="Main"
            className="order-3 w-full sm:order-none sm:w-auto sm:flex-1"
          >
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end
                    className={({ isActive }) =>
                      `rounded px-1 py-1 ${focusRing} ${
                        isActive
                          ? 'font-semibold text-teal-700 underline underline-offset-4 dark:text-teal-300'
                          : 'text-slate-700 hover:text-teal-700 dark:text-slate-300 dark:hover:text-teal-300'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="ml-auto flex items-center gap-2 sm:ml-0">
            <button
              type="button"
              onClick={user ? signOut : signIn}
              className={`rounded-lg border border-slate-400 px-3 py-1.5 text-sm font-semibold hover:bg-slate-100 dark:border-slate-500 dark:hover:bg-slate-800 ${focusRing}`}
            >
              {user ? 'Sign out' : 'Sign in (demo)'}
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 px-4 py-6 text-center text-sm text-slate-700 dark:border-slate-700 dark:text-slate-300">
        <p>
          For learning only. This site does not diagnose or give medical advice.
        </p>
      </footer>
    </div>
  )
}

export default Layout
