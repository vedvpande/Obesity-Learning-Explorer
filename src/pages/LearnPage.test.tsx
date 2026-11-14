import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { SOURCE } from '../mocks/countries.ts'
import LearnPage, { SUPPORT_URL } from './LearnPage.tsx'

function renderPage() {
  return render(
    <MemoryRouter>
      <LearnPage />
    </MemoryRouter>,
  )
}

test('has one h1 and the section headings in order', () => {
  renderPage()
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  expect(
    screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent),
  ).toEqual([
    'What does "obesity rate" mean?',
    'Common causes',
    'How to cite this data',
    'Need support?',
  ])
  expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument()
})

test('explains the rate is about adults and populations, not individuals', () => {
  renderPage()
  const section = screen
    .getByRole('heading', { name: 'What does "obesity rate" mean?' })
    .closest('section')!
  expect(section).toHaveTextContent('adults (aged 18 and over)')
  expect(section).toHaveTextContent('It is not a test for any one person')
})

test('lists several causes using person-first language', () => {
  renderPage()
  const section = screen
    .getByRole('heading', { name: 'Common causes' })
    .closest('section')!
  expect(
    within(section).getAllByRole('listitem').length,
  ).toBeGreaterThanOrEqual(5)
  expect(section).toHaveTextContent('people with obesity')
})

test('the citation example has country, year, rate and source', () => {
  renderPage()
  expect(screen.getByTestId('citation-example')).toHaveTextContent(
    `In 2022, 26.9% of adults (18+) in United Kingdom had obesity. Source: ${SOURCE}.`,
  )
})

test('the support link opens safely in a new tab', () => {
  renderPage()
  const link = screen.getByRole('link', { name: /Get support from Beat/ })
  expect(link).toHaveAttribute('href', SUPPORT_URL)
  expect(link).toHaveAttribute('target', '_blank')
  expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  expect(link).toHaveAccessibleName(/opens in a new tab/)
})

test('link text makes sense out of context', () => {
  renderPage()
  for (const link of screen.getAllByRole('link')) {
    expect(link.textContent?.trim()).not.toMatch(
      /^(click here|here|read more|more|link)$/i,
    )
  }
})

test('contains no diet, calorie or weight-loss advice', () => {
  const { container } = renderPage()
  expect(container).not.toHaveTextContent(
    /calorie|diet plan|lose weight|weight loss|ideal weight/i,
  )
})
