import { describe, it, expect } from 'vitest'
import { render } from '@/test/test-utils'
import Container from './Container'

describe('Container', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <Container>
        <div>Test Content</div>
      </Container>
    )
    expect(getByText('Test Content')).toBeInTheDocument()
  })

  it('applies default max-width of xl', () => {
    const { container } = render(<Container>Content</Container>)
    const div = container.firstChild as HTMLElement
    expect(div).toHaveClass('max-w-7xl')
  })

  it('applies custom max-width when specified', () => {
    const { container } = render(<Container maxWidth="sm">Content</Container>)
    const div = container.firstChild as HTMLElement
    expect(div).toHaveClass('max-w-2xl')
  })

  it('applies additional className when provided', () => {
    const { container } = render(<Container className="custom-class">Content</Container>)
    const div = container.firstChild as HTMLElement
    expect(div).toHaveClass('custom-class')
  })

  it('includes responsive padding classes', () => {
    const { container } = render(<Container>Content</Container>)
    const div = container.firstChild as HTMLElement
    expect(div).toHaveClass('px-4')
    expect(div).toHaveClass('sm:px-6')
    expect(div).toHaveClass('lg:px-8')
  })
})
