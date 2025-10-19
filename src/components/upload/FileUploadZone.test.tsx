import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@/test/test-utils'
import FileUploadZone from './FileUploadZone'

describe('FileUploadZone', () => {
  it('renders upload zone with instructions', () => {
    render(<FileUploadZone onFileSelect={vi.fn()} />)

    expect(screen.getByText(/Drag and drop your dating app export/i)).toBeInTheDocument()
    expect(screen.getByText(/or click to browse files/i)).toBeInTheDocument()
    expect(screen.getByText(/All processing happens on your device/i)).toBeInTheDocument()
  })

  it('calls onFileSelect when a valid file is selected', async () => {
    const onFileSelect = vi.fn()
    const { container } = render(<FileUploadZone onFileSelect={onFileSelect} />)

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    expect(input).toBeInTheDocument()

    const file = new File(['content'], 'tinder.zip', { type: 'application/zip' })
    fireEvent.change(input, { target: { files: [file] } })

    expect(onFileSelect).toHaveBeenCalledWith(
      expect.any(File),
      expect.objectContaining({ valid: true })
    )
  })

  it('calls onError when an invalid file is selected', () => {
    const onError = vi.fn()
    const { container } = render(<FileUploadZone onFileSelect={vi.fn()} onError={onError} />)

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['content'], 'test.txt', { type: 'text/plain' })

    fireEvent.change(input, { target: { files: [file] } })

    expect(onError).toHaveBeenCalledWith(expect.stringContaining('Invalid file type'))
  })

  it('shows disabled state when disabled prop is true', () => {
    const { container } = render(<FileUploadZone onFileSelect={vi.fn()} disabled={true} />)

    const zone = container.firstChild as HTMLElement
    expect(zone).toHaveClass('cursor-not-allowed')
  })

  it('opens file picker when clicked', () => {
    const { container } = render(<FileUploadZone onFileSelect={vi.fn()} />)

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const clickSpy = vi.spyOn(input, 'click')

    const zone = container.firstChild as HTMLElement
    fireEvent.click(zone)

    expect(clickSpy).toHaveBeenCalled()
  })

  it('resets file input after selection', () => {
    const { container } = render(<FileUploadZone onFileSelect={vi.fn()} />)

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['content'], 'test.zip', { type: 'application/zip' })

    // Set a value
    fireEvent.change(input, { target: { files: [file] } })

    // Value should be reset to allow same file again
    expect(input.value).toBe('')
  })
})
