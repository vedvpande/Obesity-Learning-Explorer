import { Link } from 'react-router'

function NotFoundPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-2 text-slate-700 dark:text-slate-300">
        We couldn't find that page.
      </p>
      <p className="mt-6">
        <Link
          to="/"
          className="font-semibold text-teal-700 underline hover:text-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 dark:text-teal-300 dark:hover:text-teal-200 dark:focus-visible:outline-teal-300"
        >
          Go to the home page
        </Link>
      </p>
    </div>
  )
}

export default NotFoundPage
