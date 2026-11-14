import { Link } from 'react-router'
import { buildFactSentence, latestRate } from '../lib/facts.ts'
import { countries, rates } from '../mocks/countries.ts'

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 dark:focus-visible:outline-teal-300'
const linkClass = `font-semibold text-teal-700 underline hover:text-teal-800 dark:text-teal-300 dark:hover:text-teal-200 ${focusRing}`
const textClass = 'mt-2 text-slate-700 dark:text-slate-300'

export const SUPPORT_URL = 'https://www.beateatingdisorders.org.uk/'

// Same builder as "Copy this fact" on Explore, so the example always matches.
function exampleCitation() {
  const country = countries.find((c) => c.code === 'GBR')
  const row = country && latestRate(rates, country.code)
  return country && row ? buildFactSentence(country, row) : ''
}

function LearnPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Learn</h1>
      <p className={textClass}>
        Short, plain-language guides to help you understand and use the numbers
        on this site.
      </p>

      <section aria-labelledby="meaning-heading" className="mt-10">
        <h2 id="meaning-heading" className="text-xl font-semibold">
          What does "obesity rate" mean?
        </h2>
        <p className={textClass}>
          The obesity rate is the share of adults (aged 18 and over) in a
          country who have obesity. For example, a rate of 25% means about 1 in
          every 4 adults.
        </p>
        <p className={textClass}>
          For adults, obesity is usually defined as a body mass index (BMI) of
          30 or more. BMI is worked out from height and weight. It is a rough
          measure that is useful for comparing large groups of people, such as
          whole countries or the same country over time.
        </p>
        <p className={textClass}>
          The rate describes a whole population. It is not a test for any one
          person, and it can't tell you anything about an individual's health.
        </p>
      </section>

      <section aria-labelledby="causes-heading" className="mt-10">
        <h2 id="causes-heading" className="text-xl font-semibold">
          Common causes
        </h2>
        <p className={textClass}>
          Obesity rates change because of many things working together, most of
          them outside any one person's control. Researchers point to:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-6 text-slate-700 dark:text-slate-300">
          <li>
            <strong>Environment:</strong> how towns are built, how easy it is to
            walk or play safely, and how much food advertising people see.
          </li>
          <li>
            <strong>Income:</strong> fresh food can cost more, and people on
            lower incomes often have less time and money to choose from.
          </li>
          <li>
            <strong>Food availability:</strong> which foods are cheap, easy to
            find and heavily processed in a country.
          </li>
          <li>
            <strong>Genetics:</strong> genes affect appetite and how the body
            stores energy, so some people are more likely to develop obesity.
          </li>
          <li>
            <strong>Health conditions and medicines:</strong> some illnesses and
            treatments can lead to weight gain.
          </li>
          <li>
            <strong>Sleep and stress:</strong> long working hours, poor sleep
            and stress can all play a part.
          </li>
        </ul>
        <p className={textClass}>
          Because of this, it's fairer and more accurate to talk about "people
          with obesity" rather than blaming individuals.
        </p>
      </section>

      <section aria-labelledby="cite-heading" className="mt-10">
        <h2 id="cite-heading" className="text-xl font-semibold">
          How to cite this data
        </h2>
        <p className={textClass}>
          A good citation says the country, the year, the rate and the source.
          The{' '}
          <Link to="/explore" className={linkClass}>
            Explore page
          </Link>{' '}
          builds this sentence for you with its "Copy this fact" button. For
          example:
        </p>
        <blockquote
          data-testid="citation-example"
          className="mt-3 rounded-lg border-l-4 border-teal-700 bg-slate-50 p-4 dark:border-teal-300 dark:bg-slate-800"
        >
          {exampleCitation()}
        </blockquote>
        <p className={textClass}>
          Always copy the year with the number, because rates change over time.
        </p>
      </section>

      <section
        aria-labelledby="support-heading"
        className="mt-10 rounded-xl border border-slate-300 bg-slate-50 p-6 dark:border-slate-600 dark:bg-slate-800"
      >
        <h2 id="support-heading" className="text-xl font-semibold">
          Need support?
        </h2>
        <p className="mt-2">
          If reading about weight or food is hard for you, you're not alone, and
          help is available.
        </p>
        <p className="mt-2">
          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            Get support from Beat, the UK eating disorder charity (opens in a
            new tab)
          </a>
        </p>
        <p className="mt-2">
          Outside the UK, talk to a trusted adult, a school counsellor or a
          doctor.
        </p>
      </section>
    </div>
  )
}

export default LearnPage
