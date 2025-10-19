import { describe, it, expect } from 'vitest'
import JSZip from 'jszip'
import {
  extractZipFile,
  detectPlatformFromFiles,
  formatExtractionSummary,
  type ExtractedFile,
  type ZipExtractionResult,
} from './zip-extractor'

/**
 * Helper to create a mock ZIP file with specified contents
 */
async function createMockZip(files: Record<string, string>): Promise<File> {
  const zip = new JSZip()

  for (const [filename, content] of Object.entries(files)) {
    zip.file(filename, content)
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  return new File([blob], 'test.zip', { type: 'application/zip' })
}

describe('extractZipFile', () => {
  it('extracts JSON files from ZIP', async () => {
    const zipFile = await createMockZip({
      'messages.json': JSON.stringify({ test: 'data' }),
    })

    const result = await extractZipFile(zipFile)

    expect(result.success).toBe(true)
    expect(result.files).toHaveLength(1)
    expect(result.files[0].filename).toBe('messages.json')
    expect(result.files[0].extension).toBe('json')
    expect(result.files[0].content).toBe('{"test":"data"}')
    expect(result.extractedCount).toBe(1)
  })

  it('extracts CSV files from ZIP', async () => {
    const csvContent = 'name,age\nAlice,30\nBob,25'
    const zipFile = await createMockZip({
      'data.csv': csvContent,
    })

    const result = await extractZipFile(zipFile)

    expect(result.success).toBe(true)
    expect(result.files).toHaveLength(1)
    expect(result.files[0].filename).toBe('data.csv')
    expect(result.files[0].extension).toBe('csv')
    expect(result.files[0].content).toBe(csvContent)
  })

  it('extracts multiple files from ZIP', async () => {
    const zipFile = await createMockZip({
      'matches.csv': 'match_id,user\n1,Alice',
      'messages.csv': 'message_id,text\n1,Hello',
      'profile.json': '{"name":"User"}',
    })

    const result = await extractZipFile(zipFile)

    expect(result.success).toBe(true)
    expect(result.files).toHaveLength(3)
    expect(result.extractedCount).toBe(3)
    expect(result.files.map((f) => f.filename).sort()).toEqual([
      'matches.csv',
      'messages.csv',
      'profile.json',
    ])
  })

  it('skips files with disallowed extensions', async () => {
    const zipFile = await createMockZip({
      'data.json': '{}',
      'image.png': 'binary data',
      'document.pdf': 'pdf data',
      'script.js': 'console.log("test")',
    })

    const result = await extractZipFile(zipFile)

    expect(result.success).toBe(true)
    expect(result.files).toHaveLength(1)
    expect(result.files[0].filename).toBe('data.json')
  })

  it('respects custom allowed extensions', async () => {
    const zipFile = await createMockZip({
      'data.json': '{}',
      'data.txt': 'text content',
      'data.xml': '<xml/>',
    })

    const result = await extractZipFile(zipFile, {
      allowedExtensions: ['json', 'txt'],
    })

    expect(result.success).toBe(true)
    expect(result.files).toHaveLength(2)
    expect(result.files.map((f) => f.extension).sort()).toEqual(['json', 'txt'])
  })

  it('skips macOS metadata files by default', async () => {
    const zipFile = await createMockZip({
      'data.json': '{}',
      '__MACOSX/._data.json': 'metadata',
      '.DS_Store': 'mac metadata',
      'folder/.DS_Store': 'mac metadata',
    })

    const result = await extractZipFile(zipFile)

    expect(result.success).toBe(true)
    expect(result.files).toHaveLength(1)
    expect(result.files[0].filename).toBe('data.json')
  })

  it('includes macOS metadata when skipMacOSMetadata is false', async () => {
    const zipFile = await createMockZip({
      'data.json': '{}',
      '__MACOSX/data.json': '{}',
    })

    const result = await extractZipFile(zipFile, {
      skipMacOSMetadata: false,
      allowedExtensions: ['json'],
    })

    expect(result.success).toBe(true)
    expect(result.files).toHaveLength(2)
  })

  it('skips hidden files (starting with dot)', async () => {
    const zipFile = await createMockZip({
      'data.json': '{}',
      '.hidden.json': '{}',
      'folder/.hidden.json': '{}',
    })

    const result = await extractZipFile(zipFile)

    expect(result.success).toBe(true)
    expect(result.files).toHaveLength(1)
    expect(result.files[0].filename).toBe('data.json')
  })

  it('handles nested directory structures', async () => {
    const zipFile = await createMockZip({
      'root.json': '{}',
      'folder/data.json': '{}',
      'folder/subfolder/nested.csv': 'a,b',
    })

    const result = await extractZipFile(zipFile)

    expect(result.success).toBe(true)
    expect(result.files).toHaveLength(3)
    expect(result.files.map((f) => f.filename).sort()).toEqual([
      'folder/data.json',
      'folder/subfolder/nested.csv',
      'root.json',
    ])
  })

  it('enforces maximum file size', async () => {
    const largeContent = 'x'.repeat(1000)
    const zipFile = await createMockZip({
      'small.json': '{}',
      'large.json': largeContent,
    })

    const result = await extractZipFile(zipFile, {
      maxFileSize: 100, // 100 bytes
    })

    expect(result.success).toBe(true)
    expect(result.files).toHaveLength(1)
    expect(result.files[0].filename).toBe('small.json')
  })

  it('handles empty ZIP files', async () => {
    const zipFile = await createMockZip({})

    const result = await extractZipFile(zipFile)

    expect(result.success).toBe(true)
    expect(result.files).toHaveLength(0)
    expect(result.extractedCount).toBe(0)
    expect(result.totalFiles).toBe(0)
  })

  it('handles ZIP with only directories', async () => {
    const zip = new JSZip()
    zip.folder('empty-folder')
    const blob = await zip.generateAsync({ type: 'blob' })
    const zipFile = new File([blob], 'test.zip', { type: 'application/zip' })

    const result = await extractZipFile(zipFile)

    expect(result.success).toBe(true)
    expect(result.files).toHaveLength(0)
  })

  it('returns error for invalid ZIP file', async () => {
    const invalidFile = new File(['not a zip'], 'test.zip', { type: 'application/zip' })

    const result = await extractZipFile(invalidFile)

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
    expect(result.files).toHaveLength(0)
  })

  it('calculates file sizes correctly', async () => {
    const content = 'Hello, World!'
    const zipFile = await createMockZip({
      'test.json': content,
    })

    const result = await extractZipFile(zipFile)

    expect(result.success).toBe(true)
    expect(result.files[0].size).toBe(content.length)
  })

  it('handles special characters in filenames', async () => {
    const zipFile = await createMockZip({
      'file with spaces.json': '{}',
      'file-with-dashes.json': '{}',
      'file_with_underscores.json': '{}',
    })

    const result = await extractZipFile(zipFile)

    expect(result.success).toBe(true)
    expect(result.files).toHaveLength(3)
  })

  it('case-insensitive extension matching', async () => {
    const zipFile = await createMockZip({
      'data.JSON': '{}',
      'data.Json': '{}',
      'data.CSV': 'a,b',
    })

    const result = await extractZipFile(zipFile)

    expect(result.success).toBe(true)
    expect(result.files).toHaveLength(3)
    expect(result.files.every((f) => ['json', 'csv'].includes(f.extension))).toBe(true)
  })
})

describe('detectPlatformFromFiles', () => {
  it('detects Hinge from filename', () => {
    const files: ExtractedFile[] = [
      { filename: 'hinge_messages.csv', content: '', extension: 'csv', size: 0 },
    ]

    expect(detectPlatformFromFiles(files)).toBe('hinge')
  })

  it('detects Tinder from filename', () => {
    const files: ExtractedFile[] = [
      { filename: 'tinder_data.json', content: '', extension: 'json', size: 0 },
    ]

    expect(detectPlatformFromFiles(files)).toBe('tinder')
  })

  it('detects Hinge from matches.csv filename', () => {
    const files: ExtractedFile[] = [
      { filename: 'matches.csv', content: '', extension: 'csv', size: 0 },
    ]

    expect(detectPlatformFromFiles(files)).toBe('hinge')
  })

  it('detects Hinge from messages.csv filename', () => {
    const files: ExtractedFile[] = [
      { filename: 'messages.csv', content: '', extension: 'csv', size: 0 },
    ]

    expect(detectPlatformFromFiles(files)).toBe('hinge')
  })

  it('detects Hinge from CSV-only files', () => {
    const files: ExtractedFile[] = [
      { filename: 'data1.csv', content: '', extension: 'csv', size: 0 },
      { filename: 'data2.csv', content: '', extension: 'csv', size: 0 },
    ]

    expect(detectPlatformFromFiles(files)).toBe('hinge')
  })

  it('detects Tinder from JSON-only files', () => {
    const files: ExtractedFile[] = [
      { filename: 'data1.json', content: '', extension: 'json', size: 0 },
    ]

    expect(detectPlatformFromFiles(files)).toBe('tinder')
  })

  it('returns unknown for mixed file types', () => {
    const files: ExtractedFile[] = [
      { filename: 'data.json', content: '', extension: 'json', size: 0 },
      { filename: 'data.csv', content: '', extension: 'csv', size: 0 },
    ]

    expect(detectPlatformFromFiles(files)).toBe('unknown')
  })

  it('returns unknown for empty file list', () => {
    expect(detectPlatformFromFiles([])).toBe('unknown')
  })
})

describe('formatExtractionSummary', () => {
  it('formats successful extraction', () => {
    const result: ZipExtractionResult = {
      success: true,
      files: [
        { filename: 'test.json', content: '', extension: 'json', size: 1024 },
        { filename: 'data.csv', content: '', extension: 'csv', size: 2048 },
      ],
      totalFiles: 3,
      extractedCount: 2,
    }

    const summary = formatExtractionSummary(result)

    expect(summary).toContain('Extracted 2 of 3 files')
    expect(summary).toContain('test.json')
    expect(summary).toContain('data.csv')
    expect(summary).toContain('1 KB')
    expect(summary).toContain('2 KB')
  })

  it('formats failed extraction', () => {
    const result: ZipExtractionResult = {
      success: false,
      files: [],
      error: 'Invalid ZIP format',
      totalFiles: 0,
      extractedCount: 0,
    }

    const summary = formatExtractionSummary(result)

    expect(summary).toContain('Extraction failed')
    expect(summary).toContain('Invalid ZIP format')
  })

  it('formats byte sizes correctly', () => {
    const result: ZipExtractionResult = {
      success: true,
      files: [
        { filename: 'tiny.json', content: '', extension: 'json', size: 10 },
        { filename: 'small.json', content: '', extension: 'json', size: 1024 },
        { filename: 'medium.json', content: '', extension: 'json', size: 1024 * 1024 },
      ],
      totalFiles: 3,
      extractedCount: 3,
    }

    const summary = formatExtractionSummary(result)

    expect(summary).toContain('10 B')
    expect(summary).toContain('1 KB')
    expect(summary).toContain('1 MB')
  })
})
