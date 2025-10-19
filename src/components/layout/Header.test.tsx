import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import Header from './Header'

describe('Header', () => {
  it('renders the logo and project name', () => {
    render(<Header />)
    expect(screen.getByText('Project Afterglow')).toBeInTheDocument()
  })

  it('displays the privacy badge', () => {
    render(<Header />)
    expect(screen.getByText(/100% Private/i)).toBeInTheDocument()
  })

  it('applies transparent variant by default', () => {
    const { container } = render(<Header />)
    const header = container.querySelector('header')
    expect(header).toHaveClass('bg-transparent')
  })

  it('applies solid variant when specified', () => {
    const { container } = render(<Header variant="solid" />)
    const header = container.querySelector('header')
    expect(header).toHaveClass('bg-white')
    expect(header).toHaveClass('shadow-soft')
  })
})
