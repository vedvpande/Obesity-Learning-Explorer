import { fireEvent, render, screen } from '@testing-library/react'
import ThemeToggle from './ThemeToggle.tsx'

afterEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
})

test('in light mode the button offers "Dark mode" with a moon icon', () => {
  render(<ThemeToggle />)
  const button = screen.getByRole('button', { name: 'Dark mode' })
  expect(button.querySelector('svg path')).toBeInTheDocument()
  expect(button.querySelector('svg circle')).not.toBeInTheDocument()
  expect(document.documentElement).not.toHaveClass('dark')
})

test('clicking switches to dark (label "Light mode", sun icon), then back', () => {
  render(<ThemeToggle />)

  fireEvent.click(screen.getByRole('button', { name: 'Dark mode' }))
  const lightButton = screen.getByRole('button', { name: 'Light mode' })
  expect(lightButton.querySelector('svg circle')).toBeInTheDocument()
  expect(document.documentElement).toHaveClass('dark')
  expect(localStorage.getItem('theme')).toBe('dark')

  fireEvent.click(lightButton)
  expect(screen.getByRole('button', { name: 'Dark mode' })).toBeInTheDocument()
  expect(document.documentElement).not.toHaveClass('dark')
  expect(localStorage.getItem('theme')).toBe('light')
})

test('uses the saved choice on load', () => {
  localStorage.setItem('theme', 'dark')
  render(<ThemeToggle />)
  expect(screen.getByRole('button', { name: 'Light mode' })).toBeInTheDocument()
  expect(document.documentElement).toHaveClass('dark')
})

test('icons are hidden from screen readers so the name is just the label', () => {
  render(<ThemeToggle />)
  const svg = screen
    .getByRole('button', { name: 'Dark mode' })
    .querySelector('svg')
  expect(svg).toHaveAttribute('aria-hidden', 'true')
})
