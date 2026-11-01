import { Link } from 'react-router'

const linkClass =
  'font-semibold text-teal-700 underline hover:text-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 dark:text-teal-300 dark:hover:text-teal-200 dark:focus-visible:outline-teal-300'

function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight">
          About Obesity Learning Explorer
        </h1>

        <section aria-labelledby="what-heading" className="mt-8">
          <h2 id="what-heading" className="text-xl font-semibold">
            What this app is
          </h2>
          <p className="mt-2 text-slate-700 dark:text-slate-300">
            Obesity Learning Explorer is one simple place for students to look
            up, compare and understand adult obesity trends around the world.
            You can pick a country, see its rate, and copy a fact with its year
            and source.
          </p>
        </section>

        <section aria-labelledby="project-heading" className="mt-8">
          <h2 id="project-heading" className="text-xl font-semibold">
            A learning project
          </h2>
          <p className="mt-2 text-slate-700 dark:text-slate-300">
            This app was built as a learning project. It is for education only.
            It does not store any personal health information.
          </p>
        </section>

        <section aria-labelledby="report-heading" className="mt-8">
          <h2 id="report-heading" className="text-xl font-semibold">
            My Report
          </h2>
          <p className="mt-2 text-slate-700 dark:text-slate-300">
            Signed-in students can save facts (country, year, rate, source) with
            a short note, then copy all their citations at once. This saves only
            facts and notes, never personal health information.
          </p>
        </section>

        <section
          aria-labelledby="disclaimer-heading"
          className="mt-8 rounded-xl border border-slate-300 bg-slate-50 p-6 dark:border-slate-600 dark:bg-slate-800"
        >
          <h2 id="disclaimer-heading" className="text-xl font-semibold">
            Disclaimer
          </h2>
          <p className="mt-2">
            For learning only. This site does not diagnose or give medical
            advice.
          </p>
        </section>

        <p className="mt-10">
          <Link to="/" className={linkClass}>
            Back to home
          </Link>
        </p>
      </main>
    </div>
  )
}

export default AboutPage
