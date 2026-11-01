import { Link } from 'react-router'

const features = [
  {
    title: 'Look up a country',
    description:
      'Pick a country to see its adult obesity rate, then copy the fact with its year and source, ready to cite.',
  },
  {
    title: 'Compare trends',
    description:
      'See how rates have changed from 1990 to 2022 and put two countries side by side on one chart.',
  },
  {
    title: 'Learn the basics',
    description:
      'Plain-language explanations of what an obesity rate measures, common causes, and how to cite data.',
  },
]

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-16 sm:px-6 sm:py-24">
        <section aria-labelledby="hero-heading" className="text-center">
          <h1
            id="hero-heading"
            className="text-4xl font-bold tracking-tight sm:text-5xl"
          >
            Obesity Learning Explorer
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-700 dark:text-slate-300">
            One simple place for students to look up, compare and understand
            adult obesity trends around the world, with a source you can cite.
          </p>
          <Link
            to="/explore"
            className="mt-8 inline-block rounded-lg bg-teal-700 px-6 py-3 text-base font-semibold text-white hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 dark:focus-visible:outline-teal-300"
          >
            Get started
          </Link>
        </section>

        <section aria-labelledby="features-heading" className="mt-20">
          <h2 id="features-heading" className="sr-only">
            Features
          </h2>
          <ul className="grid gap-6 sm:grid-cols-3">
            {features.map((feature) => (
              <li
                key={feature.title}
                className="rounded-xl border border-slate-200 p-6 dark:border-slate-700"
              >
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-slate-700 dark:text-slate-300">
                  {feature.description}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-slate-200 px-4 py-6 text-center text-sm text-slate-700 dark:border-slate-700 dark:text-slate-300">
        <p>
          For education only. Not medical advice. In an emergency, call your
          local emergency number.
        </p>
        <p className="mt-2">
          <Link
            to="/about"
            className="font-semibold text-teal-700 underline hover:text-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 dark:text-teal-300 dark:hover:text-teal-200 dark:focus-visible:outline-teal-300"
          >
            About
          </Link>
        </p>
      </footer>
    </div>
  )
}

export default LandingPage
