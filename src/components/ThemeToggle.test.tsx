import { fireEvent, render, screen } from '@testing-library/react'
import ThemeToggle from './ThemeToggle.tsx'

afterEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
})

test('starts in light mode when nothing is saved', () => {
  render(<ThemeToggle />)
  expect(screen.getByRole('button', { name: 'Dark mode' })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
  expect(document.documentElement).not.toHaveClass('dark')
})

test('clicking switches to dark, then back to light', () => {
  render(<ThemeToggle />)
  const button = screen.getByRole('button', { name: 'Dark mode' })

  fireEvent.click(button)
  expect(button).toHaveAttribute('aria-pressed', 'true')
  expect(document.documentElement).toHaveClass('dark')
  expect(localStorage.getItem('theme')).toBe('dark')

  fireEvent.click(button)
  expect(button).toHaveAttribute('aria-pressed', 'false')
  expect(document.documentElement).not.toHaveClass('dark')
  expect(localStorage.getItem('theme')).toBe('light')
})

test('uses the saved choice on load', () => {
  localStorage.setItem('theme', 'dark')
  render(<ThemeToggle />)
  expect(screen.getByRole('button', { name: 'Dark mode' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(document.documentElement).toHaveClass('dark')
})
