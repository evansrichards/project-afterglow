import { describe, it, expect } from 'vitest'
import {
  validateFileType,
  validateFileSize,
  detectPlatform,
  validateFile,
  formatFileSize,
  MAX_FILE_SIZE,
} from './validation'

describe('File Validation', () => {
  describe('validateFileType', () => {
    it('accepts ZIP files', () => {
      const file = new File(['content'], 'test.zip', { type: 'application/zip' })
      expect(validateFileType(file)).toBe(true)
    })

    it('accepts JSON files', () => {
      const file = new File(['content'], 'test.json', { type: 'application/json' })
      expect(validateFileType(file)).toBe(true)
    })

    it('rejects other file types', () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })
      expect(validateFileType(file)).toBe(false)
    })

    it('validates by extension when MIME type is incorrect', () => {
      const file = new File(['content'], 'test.zip', { type: 'application/octet-stream' })
      expect(validateFileType(file)).toBe(true)
    })
  })

  describe('validateFileSize', () => {
    it('accepts files under the limit', () => {
      const file = new File(['x'.repeat(1000)], 'test.zip')
      expect(validateFileSize(file)).toBe(true)
    })

    it('rejects files over the limit', () => {
      // Create a mock file object without allocating huge memory
      const file = { size: MAX_FILE_SIZE + 1 } as File
      expect(validateFileSize(file)).toBe(false)
    })

    it('rejects empty files', () => {
      const file = new File([], 'test.zip')
      expect(validateFileSize(file)).toBe(false)
    })
  })

  describe('detectPlatform', () => {
    it('detects Tinder from filename', () => {
      expect(detectPlatform('tinder-data.zip')).toBe('tinder')
      expect(detectPlatform('Tinder_Export.json')).toBe('tinder')
    })

    it('detects Hinge from filename', () => {
      expect(detectPlatform('hinge-export.zip')).toBe('hinge')
      expect(detectPlatform('Hinge_Messages.csv')).toBe('hinge')
    })

    it('detects Hinge from common patterns', () => {
      expect(detectPlatform('matches.csv')).toBe('hinge')
      expect(detectPlatform('messages_sample.csv')).toBe('hinge')
    })

    it('returns unknown for unrecognized files', () => {
      expect(detectPlatform('random-file.zip')).toBe('unknown')
    })
  })

  describe('validateFile', () => {
    it('validates a correct file', () => {
      const file = new File(['content'], 'tinder.zip', { type: 'application/zip' })
      const result = validateFile(file)

      expect(result.valid).toBe(true)
      expect(result.platform).toBe('tinder')
      expect(result.error).toBeUndefined()
    })

    it('rejects empty files with appropriate message', () => {
      const file = new File([], 'test.zip', { type: 'application/zip' })
      const result = validateFile(file)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('empty')
    })

    it('rejects oversized files with appropriate message', () => {
      // Mock a large file without allocating memory
      const file = {
        size: MAX_FILE_SIZE + 1,
        name: 'test.zip',
        type: 'application/zip',
      } as File
      const result = validateFile(file)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('too large')
    })

    it('rejects invalid file types with appropriate message', () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })
      const result = validateFile(file)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('Invalid file type')
    })

    it('does not include platform if undetected', () => {
      const file = new File(['content'], 'unknown.zip', { type: 'application/zip' })
      const result = validateFile(file)

      expect(result.valid).toBe(true)
      expect(result.platform).toBeUndefined()
    })
  })

  describe('formatFileSize', () => {
    it('formats bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
      expect(formatFileSize(500)).toBe('500 Bytes')
    })

    it('formats kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1536)).toBe('1.5 KB')
    })

    it('formats megabytes correctly', () => {
      expect(formatFileSize(1048576)).toBe('1 MB')
      expect(formatFileSize(5242880)).toBe('5 MB')
    })

    it('formats gigabytes correctly', () => {
      expect(formatFileSize(1073741824)).toBe('1 GB')
    })
  })
})
