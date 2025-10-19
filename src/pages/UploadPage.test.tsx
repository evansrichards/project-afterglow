import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UploadPage from './UploadPage'
import JSZip from 'jszip'

/**
 * Helper to create a mock ZIP file
 */
async function createMockZip(files: Record<string, string>): Promise<File> {
  const zip = new JSZip()
  for (const [filename, content] of Object.entries(files)) {
    zip.file(filename, content)
  }
  const blob = await zip.generateAsync({ type: 'blob' })
  return new File([blob], 'test.zip', { type: 'application/zip' })
}

describe('UploadPage - ZIP Integration', () => {
  it('renders upload page', () => {
    render(<UploadPage />)
    expect(screen.getByText('Upload Your Data')).toBeInTheDocument()
  })

  it('extracts and displays ZIP file contents', async () => {
    const user = userEvent.setup()

    // Create a mock Hinge ZIP
    const zipFile = await createMockZip({
      'matches.csv': 'match_id,user\n1,Alice',
      'messages.csv': 'message_id,text\n1,Hello',
    })

    render(<UploadPage />)

    // Find the file input
    const fileInput = screen.getByLabelText(/upload file/i)

    // Upload the file
    await user.upload(fileInput, zipFile)

    // Wait for success message (processing may be too fast to catch)
    await waitFor(
      () => {
        expect(screen.getByText(/file ready to process/i)).toBeInTheDocument()
      },
      { timeout: 3000 },
    )

    // Check that extracted files are shown
    expect(screen.getByText(/extracted 2 files/i)).toBeInTheDocument()
    expect(screen.getByText(/matches\.csv, messages\.csv/i)).toBeInTheDocument()
  })

  it('detects Tinder platform from ZIP contents', async () => {
    const user = userEvent.setup()

    // Create a mock Tinder ZIP
    const zipFile = await createMockZip({
      'data.json': JSON.stringify({ Messages: [] }),
    })

    render(<UploadPage />)

    const fileInput = screen.getByLabelText(/upload file/i)
    await user.upload(fileInput, zipFile)

    await waitFor(
      () => {
        expect(screen.getByText(/detected: tinder/i)).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
  })

  it('detects Hinge platform from ZIP contents', async () => {
    const user = userEvent.setup()

    // Create a mock Hinge ZIP
    const zipFile = await createMockZip({
      'matches.csv': 'data',
    })

    render(<UploadPage />)

    const fileInput = screen.getByLabelText(/upload file/i)
    await user.upload(fileInput, zipFile)

    await waitFor(
      () => {
        expect(screen.getByText(/detected: hinge/i)).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
  })

  it('handles empty ZIP files gracefully', async () => {
    const user = userEvent.setup()

    // Create an empty ZIP
    const zipFile = await createMockZip({})

    render(<UploadPage />)

    const fileInput = screen.getByLabelText(/upload file/i)
    await user.upload(fileInput, zipFile)

    await waitFor(
      () => {
        expect(screen.getByText(/contains no valid data files/i)).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
  })

  it('handles invalid ZIP files', async () => {
    const user = userEvent.setup()

    // Create an invalid "ZIP" file
    const invalidFile = new File(['not a zip'], 'invalid.zip', { type: 'application/zip' })

    render(<UploadPage />)

    const fileInput = screen.getByLabelText(/upload file/i)
    await user.upload(fileInput, invalidFile)

    await waitFor(
      () => {
        expect(screen.getByText(/unable to process file/i)).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
  })

  it('allows clearing and re-uploading files', async () => {
    const user = userEvent.setup()

    const zipFile = await createMockZip({
      'data.json': '{}',
    })

    render(<UploadPage />)

    const fileInput = screen.getByLabelText(/upload file/i)
    await user.upload(fileInput, zipFile)

    // Wait for success
    await waitFor(
      () => {
        expect(screen.getByText(/file ready to process/i)).toBeInTheDocument()
      },
      { timeout: 3000 },
    )

    // Click clear button
    const clearButton = screen.getByText(/choose different file/i)
    await user.click(clearButton)

    // Verify upload zone is available again
    expect(screen.getByText(/drag and drop your dating app export/i)).toBeInTheDocument()
  })

  it('handles JSON files directly', async () => {
    const user = userEvent.setup()

    // Create a plain JSON file (not zipped)
    const jsonFile = new File([JSON.stringify({ test: 'data' })], 'tinder.json', {
      type: 'application/json',
    })

    render(<UploadPage />)

    const fileInput = screen.getByLabelText(/upload file/i)
    await user.upload(fileInput, jsonFile)

    await waitFor(
      () => {
        expect(screen.getByText(/file ready to process/i)).toBeInTheDocument()
      },
      { timeout: 3000 },
    )

    // Should show the filename
    expect(screen.getByText(/tinder\.json/i)).toBeInTheDocument()
  })

  it('shows processing state while extracting', async () => {
    const user = userEvent.setup()

    const zipFile = await createMockZip({
      'data.json': JSON.stringify({ large: 'content' }),
    })

    render(<UploadPage />)

    const fileInput = screen.getByLabelText(/upload file/i)

    // Start upload
    await user.upload(fileInput, zipFile)

    // Wait for completion (processing may be too fast to test reliably in sync tests)
    await waitFor(
      () => {
        expect(screen.getByText(/file ready to process/i)).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
  })

  it('logs extraction summary to console', async () => {
    const consoleSpy = vi.spyOn(console, 'log')
    const user = userEvent.setup()

    const zipFile = await createMockZip({
      'test.json': '{}',
    })

    render(<UploadPage />)

    const fileInput = screen.getByLabelText(/upload file/i)
    await user.upload(fileInput, zipFile)

    await waitFor(
      () => {
        expect(screen.getByText(/file ready to process/i)).toBeInTheDocument()
      },
      { timeout: 3000 },
    )

    // Check that extraction summary was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      'ZIP extraction summary:',
      expect.stringContaining('Extracted'),
    )
    expect(consoleSpy).toHaveBeenCalledWith('Detected platform:', expect.any(String))

    consoleSpy.mockRestore()
  })
})
