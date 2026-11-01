import { useEffect, useState } from 'react'
import { applyTheme, getInitialTheme, saveTheme } from '../lib/theme.ts'

function ThemeToggle() {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  function handleClick() {
    const next = theme === 'dark' ? 'light' : 'dark'
    saveTheme(next)
    setTheme(next)
  }

  return (
    <button
      type="button"
      aria-pressed={theme === 'dark'}
      onClick={handleClick}
      className="absolute top-2 right-4 rounded-lg border border-slate-400 bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:focus-visible:outline-teal-300"
    >
      Dark mode
    </button>
  )
}

export default ThemeToggle
