import JSZip from 'jszip'

/**
 * Represents a file extracted from a ZIP archive
 */
export interface ExtractedFile {
  /** Original filename within the ZIP */
  filename: string
  /** File contents as text */
  content: string
  /** File extension (lowercase, without dot) */
  extension: string
  /** File size in bytes */
  size: number
}

/**
 * Result of ZIP extraction operation
 */
export interface ZipExtractionResult {
  success: boolean
  files: ExtractedFile[]
  error?: string
  /** Total number of files found in ZIP */
  totalFiles: number
  /** Number of files successfully extracted */
  extractedCount: number
}

/**
 * Options for ZIP extraction
 */
export interface ZipExtractionOptions {
  /** Maximum file size to extract (bytes). Default: 100MB */
  maxFileSize?: number
  /** File extensions to extract (without dot). Default: ['json', 'csv'] */
  allowedExtensions?: string[]
  /** Whether to skip macOS metadata files. Default: true */
  skipMacOSMetadata?: boolean
}

const DEFAULT_OPTIONS: Required<ZipExtractionOptions> = {
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedExtensions: ['json', 'csv'],
  skipMacOSMetadata: true,
}

/**
 * Checks if a filename should be skipped during extraction
 */
function shouldSkipFile(filename: string, options: Required<ZipExtractionOptions>): boolean {
  // Skip directories
  if (filename.endsWith('/')) {
    return true
  }

  // Skip macOS metadata files
  if (options.skipMacOSMetadata) {
    if (filename.startsWith('__MACOSX/') || filename.includes('/.DS_Store')) {
      return true
    }
  }

  // Skip hidden files (starting with .)
  const basename = filename.split('/').pop() || ''
  if (basename.startsWith('.')) {
    return true
  }

  return false
}

/**
 * Gets the file extension from a filename (lowercase, without dot)
 */
function getExtension(filename: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? parts.pop()!.toLowerCase() : ''
}

/**
 * Checks if a file extension is allowed
 */
function isAllowedExtension(extension: string, options: Required<ZipExtractionOptions>): boolean {
  return options.allowedExtensions.includes(extension.toLowerCase())
}

/**
 * Extracts files from a ZIP archive
 *
 * @param file - The ZIP file to extract
 * @param options - Extraction options
 * @returns Promise resolving to extraction result
 *
 * @example
 * ```typescript
 * const result = await extractZipFile(zipFile);
 * if (result.success) {
 *   result.files.forEach(file => {
 *     console.log(`Extracted: ${file.filename} (${file.size} bytes)`);
 *   });
 * }
 * ```
 */
export async function extractZipFile(
  file: File,
  options: ZipExtractionOptions = {}
): Promise<ZipExtractionResult> {
  const opts: Required<ZipExtractionOptions> = {
    ...DEFAULT_OPTIONS,
    ...options,
  }

  try {
    // Load the ZIP file
    const zip = await JSZip.loadAsync(file)

    const extractedFiles: ExtractedFile[] = []
    const fileEntries = Object.entries(zip.files)
    let extractedCount = 0

    // Process each file in the ZIP
    for (const [filename, zipEntry] of fileEntries) {
      // Skip directories and unwanted files
      if (shouldSkipFile(filename, opts)) {
        continue
      }

      const extension = getExtension(filename)

      // Skip files with disallowed extensions
      if (!isAllowedExtension(extension, opts)) {
        continue
      }

      try {
        // Get file content as text
        const content = await zipEntry.async('text')
        const size = content.length

        // Check file size
        if (size > opts.maxFileSize) {
          console.warn(`Skipping ${filename}: exceeds max size (${size} > ${opts.maxFileSize})`)
          continue
        }

        extractedFiles.push({
          filename,
          content,
          extension,
          size,
        })

        extractedCount++
      } catch (error) {
        console.warn(`Failed to extract ${filename}:`, error)
        // Continue processing other files
      }
    }

    return {
      success: true,
      files: extractedFiles,
      totalFiles: fileEntries.length,
      extractedCount,
    }
  } catch (error) {
    return {
      success: false,
      files: [],
      error: error instanceof Error ? error.message : 'Unknown error during ZIP extraction',
      totalFiles: 0,
      extractedCount: 0,
    }
  }
}

/**
 * Detects the platform (Tinder or Hinge) from extracted files
 */
export function detectPlatformFromFiles(files: ExtractedFile[]): 'tinder' | 'hinge' | 'unknown' {
  // Check for Hinge-specific patterns first
  const hasHingeExportFolder = files.some((f) => f.filename.startsWith('export/'))
  const hasHingeMatchesJson = files.some((f) =>
    f.filename.toLowerCase().endsWith('export/matches.json')
  )
  const hasHingeUserJson = files.some((f) =>
    f.filename.toLowerCase().endsWith('export/user.json')
  )

  // Hinge exports have a specific structure with export/ folder
  if (hasHingeExportFolder || hasHingeMatchesJson || hasHingeUserJson) {
    return 'hinge'
  }

  // Check for Hinge CSV files
  const hasHingeCsvFiles = files.some(
    (f) =>
      f.filename.toLowerCase().includes('hinge') ||
      f.filename.toLowerCase().includes('matches.csv') ||
      f.filename.toLowerCase().includes('messages.csv')
  )

  if (hasHingeCsvFiles) {
    return 'hinge'
  }

  // Check for Tinder-specific patterns
  const hasTinderFiles = files.some((f) => f.filename.toLowerCase().includes('tinder'))
  // Tinder data.json is typically in a dated folder (e.g., "2025-07-22/data.json")
  const hasTinderDataJson = files.some((f) => {
    const lower = f.filename.toLowerCase()
    return lower.endsWith('data.json') && lower.includes('/')
  })

  if (hasTinderFiles || hasTinderDataJson) {
    return 'tinder'
  }

  // Fallback: Check by file types - only if exclusively one type
  const hasCSV = files.some((f) => f.extension === 'csv')
  const hasJSON = files.some((f) => f.extension === 'json')

  // If mixed file types, we can't determine the platform
  if (hasCSV && hasJSON) {
    return 'unknown'
  }

  if (hasCSV) {
    return 'hinge'
  }

  if (hasJSON) {
    return 'tinder'
  }

  return 'unknown'
}

/**
 * Formats extraction result for display
 */
export function formatExtractionSummary(result: ZipExtractionResult): string {
  if (!result.success) {
    return `Extraction failed: ${result.error}`
  }

  const filesList = result.files.map((f) => `  - ${f.filename} (${formatBytes(f.size)})`).join('\n')

  return `Extracted ${result.extractedCount} of ${result.totalFiles} files:\n${filesList}`
}

/**
 * Formats bytes to human-readable size
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
