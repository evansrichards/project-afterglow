/**
 * File upload validation utilities
 */

export interface FileValidationResult {
  valid: boolean
  error?: string
  platform?: 'tinder' | 'hinge'
}

/**
 * Maximum file size: 100MB
 */
export const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB in bytes

/**
 * Accepted file types
 */
export const ACCEPTED_FILE_TYPES = {
  zip: 'application/zip',
  'x-zip': 'application/x-zip-compressed',
  json: 'application/json',
}

/**
 * Accepted file extensions
 */
export const ACCEPTED_EXTENSIONS = ['.zip', '.json']

/**
 * Validate file type based on MIME type and extension
 */
export function validateFileType(file: File): boolean {
  // Check MIME type
  const mimeTypeValid = Object.values(ACCEPTED_FILE_TYPES).includes(file.type)

  // Check extension
  const fileName = file.name.toLowerCase()
  const extensionValid = ACCEPTED_EXTENSIONS.some((ext) => fileName.endsWith(ext))

  return mimeTypeValid || extensionValid
}

/**
 * Validate file size
 */
export function validateFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE && file.size > 0
}

/**
 * Detect platform from filename
 */
export function detectPlatform(fileName: string): 'tinder' | 'hinge' | 'unknown' {
  const lowerName = fileName.toLowerCase()

  if (lowerName.includes('tinder')) {
    return 'tinder'
  }

  if (lowerName.includes('hinge')) {
    return 'hinge'
  }

  // Check for known Hinge export patterns
  if (lowerName.includes('matches') || lowerName.includes('messages')) {
    return 'hinge'
  }

  return 'unknown'
}

/**
 * Validate uploaded file
 */
export function validateFile(file: File): FileValidationResult {
  // Check file size
  if (!validateFileSize(file)) {
    if (file.size === 0) {
      return {
        valid: false,
        error: 'This file appears to be empty. Please select a valid export file.',
      }
    }
    return {
      valid: false,
      error: `File is too large (${formatFileSize(file.size)}). Maximum size is ${formatFileSize(MAX_FILE_SIZE)}.`,
    }
  }

  // Check file type
  if (!validateFileType(file)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload a ZIP or JSON file from your dating app export.',
    }
  }

  // Detect platform
  const platform = detectPlatform(file.name)

  return {
    valid: true,
    platform: platform === 'unknown' ? undefined : platform,
  }
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`
}
