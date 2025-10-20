/**
 * Upload Page
 *
 * Main upload experience with drag-and-drop, sample data, and instructions
 */

import { useState } from 'react'
import Header from '@components/layout/Header'
import Footer from '@components/layout/Footer'
import Container from '@components/layout/Container'
import FileUploadZone from '@components/upload/FileUploadZone'
import SampleDataLinks from '@components/upload/SampleDataLinks'
import ExportInstructions from '@components/upload/ExportInstructions'
import type { FileValidationResult } from '@lib/upload/validation'
import {
  extractZipFile,
  detectPlatformFromFiles,
  formatExtractionSummary,
  type ExtractedFile,
} from '@lib/upload/zip-extractor'
import { parseExtractedFiles, type ParseResult } from '@lib/parsers'

export default function UploadPage() {
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [validation, setValidation] = useState<FileValidationResult | null>(null)
  const [extractedFiles, setExtractedFiles] = useState<ExtractedFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [detectedPlatform, setDetectedPlatform] = useState<'tinder' | 'hinge' | 'unknown' | null>(
    null
  )
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)

  const handleFileSelect = async (file: File, validationResult: FileValidationResult) => {
    console.log('File selected:', file.name, validationResult)
    setSelectedFile(file)
    setValidation(validationResult)
    setError(null)
    setIsProcessing(true)

    try {
      // If it's a ZIP file, extract it
      if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
        const result = await extractZipFile(file)

        if (!result.success) {
          setError(result.error || 'Failed to extract ZIP file')
          setIsProcessing(false)
          return
        }

        if (result.files.length === 0) {
          setError('ZIP file contains no valid data files (JSON or CSV)')
          setIsProcessing(false)
          return
        }

        setExtractedFiles(result.files)
        const platform = detectPlatformFromFiles(result.files)
        setDetectedPlatform(platform)

        console.log('ZIP extraction summary:', formatExtractionSummary(result))
        console.log('Detected platform:', platform)

        // Parse the extracted files
        if (platform !== 'unknown') {
          const parseResult = await parseExtractedFiles(result.files, platform)

          if (!parseResult.success) {
            setError(
              `Failed to parse ${platform} data: ${parseResult.errors?.map((e) => e.message).join(', ')}`,
            )
            setIsProcessing(false)
            return
          }

          setParseResult(parseResult)
          console.log('Parse result:', parseResult.metadata)

          if (parseResult.warnings && parseResult.warnings.length > 0) {
            console.warn('Parse warnings:', parseResult.warnings)
          }
        }
      } else {
        // For JSON files, store as-is and parse
        const content = await file.text()
        const files = [
          {
            filename: file.name,
            content,
            extension: 'json',
            size: content.length,
          },
        ]
        setExtractedFiles(files)
        const platform = validationResult.platform || 'unknown'
        setDetectedPlatform(platform)

        // Parse JSON file
        if (platform !== 'unknown') {
          const parseResult = await parseExtractedFiles(files, platform)

          if (!parseResult.success) {
            setError(
              `Failed to parse ${platform} data: ${parseResult.errors?.map((e) => e.message).join(', ')}`,
            )
            setIsProcessing(false)
            return
          }

          setParseResult(parseResult)
          console.log('Parse result:', parseResult.metadata)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
    setSelectedFile(null)
    setValidation(null)
  }

  const handleSampleSelect = async (platform: 'tinder' | 'hinge') => {
    console.log('Sample selected:', platform)
    setError(null)
    setIsProcessing(true)

    try {
      // Load sample data from examples folder
      const filename = platform === 'tinder' ? 'tinder-data.zip' : 'hinge-data.zip'
      const response = await fetch(`/examples/${filename}`)

      if (!response.ok) {
        throw new Error(`Failed to load sample ${platform} data`)
      }

      const blob = await response.blob()
      const file = new File([blob], filename, { type: 'application/zip' })

      // Use the same validation result as for uploaded files
      const validationResult: FileValidationResult = {
        valid: true,
        platform: undefined, // Will be detected from ZIP contents
      }

      // Process the file using the existing handler
      await handleFileSelect(file, validationResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sample data')
      setIsProcessing(false)
    }
  }

  const handleClearFile = () => {
    setSelectedFile(null)
    setValidation(null)
    setError(null)
    setExtractedFiles([])
    setDetectedPlatform(null)
    setIsProcessing(false)
    setParseResult(null)
  }

  return (
    <div className="flex min-h-screen flex-col bg-warm-50">
      <Header variant="solid" />

      <main className="flex-1 py-12">
        <Container maxWidth="lg">
          {/* Page header */}
          <div className="section-header mb-12 text-center">
            <h1 className="section-title">Upload Your Data</h1>
            <p className="section-description mx-auto">
              Take a breath — your messages stay with you. Let's turn your dating history into
              insights that celebrate your growth.
            </p>
          </div>

          <div className="space-y-12">
            {/* Upload zone */}
            <div>
              <FileUploadZone
                onFileSelect={handleFileSelect}
                onError={handleError}
                disabled={!!selectedFile}
              />

              {/* Error message */}
              {error && (
                <div className="mt-4 animate-slide-up rounded-xl bg-red-50 p-4">
                  <div className="flex gap-3">
                    <svg
                      className="h-5 w-5 flex-shrink-0 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-red-900">Unable to process file</h4>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Processing message */}
              {isProcessing && (
                <div className="mt-4 animate-slide-up rounded-xl bg-blue-50 p-4">
                  <div className="flex gap-3">
                    <svg
                      className="h-5 w-5 flex-shrink-0 animate-spin text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-blue-900">Processing your file...</h4>
                      <p className="text-sm text-blue-700">Extracting and validating your data</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Success message */}
              {selectedFile && validation && !isProcessing && (
                <div className="mt-4 animate-slide-up rounded-xl bg-green-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3">
                      <svg
                        className="h-5 w-5 flex-shrink-0 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div>
                        <h4 className="font-semibold text-green-900">
                          {parseResult ? 'Data parsed successfully' : 'File ready to process'}
                        </h4>
                        <p className="text-sm text-green-700">
                          {selectedFile.name}
                          {detectedPlatform && detectedPlatform !== 'unknown' && (
                            <> · Detected: {detectedPlatform}</>
                          )}
                        </p>
                        {parseResult && parseResult.metadata && (
                          <p className="mt-1 text-sm text-green-600">
                            Parsed {parseResult.metadata.messageCount} messages, {parseResult.metadata.matchCount} matches, {parseResult.metadata.participantCount} participants
                          </p>
                        )}
                        {extractedFiles.length > 0 && !parseResult && (
                          <p className="mt-1 text-sm text-green-600">
                            Extracted {extractedFiles.length} file
                            {extractedFiles.length !== 1 ? 's' : ''}:{' '}
                            {extractedFiles.map((f) => f.filename).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={handleClearFile}
                      className="text-sm text-green-700 underline hover:text-green-900"
                    >
                      Choose different file
                    </button>
                  </div>

                  {/* Next step button (for future implementation) */}
                  <div className="mt-4">
                    <button
                      className="btn-primary w-full sm:w-auto"
                      onClick={() => console.log('Process files:', extractedFiles)}
                    >
                      Process File →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            {!selectedFile && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-warm-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-warm-50 px-4 text-warm-500">or</span>
                  </div>
                </div>

                {/* Sample data */}
                <SampleDataLinks onSampleSelect={handleSampleSelect} />

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-warm-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-warm-50 px-4 text-warm-500">
                      Need help getting your data?
                    </span>
                  </div>
                </div>

                {/* Instructions */}
                <ExportInstructions />
              </>
            )}
          </div>

          {/* Privacy reassurance */}
          <div className="mt-12 rounded-2xl bg-twilight-50 p-8">
            <div className="flex flex-col items-start gap-6 sm:flex-row">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-twilight-600 text-white">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="font-display text-lg font-semibold text-twilight-900">
                  Your data never leaves your device
                </h3>
                <p className="text-twilight-700">
                  All file processing happens right here in your browser. We don't send your
                  messages, matches, or any personal information to our servers. You can delete
                  everything instantly at any time.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  )
}
