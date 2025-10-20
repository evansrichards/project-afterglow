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
import AnalysisResultsDisplay from '@components/results/AnalysisResultsDisplay'
import type { FileValidationResult } from '@lib/upload/validation'
import {
  extractZipFile,
  detectPlatformFromFiles,
  formatExtractionSummary,
  type ExtractedFile,
} from '@lib/upload/zip-extractor'
import { parseExtractedFiles, type ParseResult } from '@lib/parsers'
import { analyzeData, ApiError } from '@api/client'
import type { AnalyzeResponse } from '../../server/types/api'

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
  const [showAnalysisPreview, setShowAnalysisPreview] = useState(false)

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalyzeResponse | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

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
    setAnalysisResult(null)
    setAnalysisError(null)
    setShowAnalysisPreview(false)
  }

  const handleAnalyze = async () => {
    if (!parseResult?.data) {
      setError('No parsed data available for analysis')
      return
    }

    // Find the current user's ID from participants
    console.log('🔍 All participants:', parseResult.data.participants)
    const currentUser = parseResult.data.participants.find((p) => p.isUser)
    console.log('🔍 Current user found:', currentUser)

    if (!currentUser) {
      setError('Could not identify current user in parsed data')
      return
    }

    if (!currentUser.id) {
      setError('Current user found but has no ID')
      console.error('Current user object:', currentUser)
      return
    }

    setIsAnalyzing(true)
    setAnalysisError(null)
    setShowAnalysisPreview(false)

    try {
      console.log('🔬 Starting analysis...')
      console.log('   Sending to backend:', {
        messages: parseResult.data.messages.length,
        matches: parseResult.data.matches.length,
        participants: parseResult.data.participants.length,
        userId: currentUser.id,
        platform: detectedPlatform,
      })

      const result = await analyzeData({
        messages: parseResult.data.messages,
        matches: parseResult.data.matches,
        participants: parseResult.data.participants,
        userId: currentUser.id,
        platform: (detectedPlatform as 'tinder' | 'hinge' | 'other') || 'other',
      })

      console.log('✅ Analysis complete:', result)
      setAnalysisResult(result)
    } catch (err) {
      console.error('❌ Analysis failed:', err)

      if (err instanceof ApiError) {
        setAnalysisError(`Analysis failed: ${err.message}`)
      } else if (err instanceof Error) {
        setAnalysisError(err.message)
      } else {
        setAnalysisError('An unknown error occurred during analysis')
      }
    } finally {
      setIsAnalyzing(false)
    }
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

                  {/* Next step button */}
                  <div className="mt-4">
                    <button
                      className="btn-primary w-full sm:w-auto"
                      onClick={handleAnalyze}
                      disabled={!parseResult?.data || isAnalyzing}
                    >
                      {isAnalyzing ? 'Analyzing...' : 'Analyze Data →'}
                    </button>
                  </div>
                </div>
              )}

              {/* Analysis in progress */}
              {isAnalyzing && (
                <div className="mt-6 animate-slide-up rounded-xl bg-blue-50 p-6">
                  <div className="flex gap-4">
                    <svg
                      className="h-8 w-8 flex-shrink-0 animate-spin text-blue-600"
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
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-blue-900">
                        Running AI Analysis...
                      </h3>
                      <p className="mt-1 text-sm text-blue-700">
                        This may take 30-60 seconds as we analyze your conversations for patterns,
                        safety concerns, and insights.
                      </p>
                      <div className="mt-4 space-y-2 text-sm text-blue-600">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-blue-400"></div>
                          <span>Screening for safety concerns...</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-blue-300"></div>
                          <span>Analyzing conversation patterns...</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-blue-200"></div>
                          <span>Generating insights...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Analysis error */}
              {analysisError && !isAnalyzing && (
                <div className="mt-6 animate-slide-up rounded-xl bg-red-50 p-6">
                  <div className="flex gap-3">
                    <svg
                      className="h-6 w-6 flex-shrink-0 text-red-600"
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
                      <h4 className="font-semibold text-red-900">Analysis Failed</h4>
                      <p className="mt-1 text-sm text-red-700">{analysisError}</p>
                      <button
                        onClick={handleAnalyze}
                        className="mt-3 text-sm font-medium text-red-800 underline hover:text-red-900"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Analysis results */}
              {analysisResult && !isAnalyzing && (
                <div className="mt-6">
                  <AnalysisResultsDisplay
                    result={analysisResult}
                    onNewAnalysis={handleClearFile}
                  />
                </div>
              )}

              {/* Analysis Preview */}
              {showAnalysisPreview && parseResult?.data && !isAnalyzing && !analysisResult && (
                <div className="mt-6 animate-slide-up rounded-xl bg-purple-50 p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-purple-900">
                        ✅ Data Successfully Parsed!
                      </h3>
                      <p className="mt-1 text-sm text-purple-700">
                        Your data is ready for analysis
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAnalysisPreview(false)}
                      className="text-purple-600 hover:text-purple-800"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg bg-white p-4 shadow-soft">
                      <div className="text-2xl font-bold text-purple-900">
                        {parseResult.data.messages.length.toLocaleString()}
                      </div>
                      <div className="mt-1 text-sm text-purple-700">Messages</div>
                    </div>
                    <div className="rounded-lg bg-white p-4 shadow-soft">
                      <div className="text-2xl font-bold text-purple-900">
                        {parseResult.data.matches.length.toLocaleString()}
                      </div>
                      <div className="mt-1 text-sm text-purple-700">Matches</div>
                    </div>
                    <div className="rounded-lg bg-white p-4 shadow-soft">
                      <div className="text-2xl font-bold text-purple-900">
                        {parseResult.data.participants.length.toLocaleString()}
                      </div>
                      <div className="mt-1 text-sm text-purple-700">Participants</div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-lg bg-white p-4 shadow-soft">
                    <h4 className="font-semibold text-purple-900">Platform Details</h4>
                    <div className="mt-2 space-y-1 text-sm text-purple-700">
                      <div>
                        <span className="font-medium">Platform:</span>{' '}
                        {parseResult.metadata?.platform || 'unknown'}
                      </div>
                      <div>
                        <span className="font-medium">Parser Version:</span>{' '}
                        {parseResult.metadata?.parserVersion || 'N/A'}
                      </div>
                      {parseResult.warnings && parseResult.warnings.length > 0 && (
                        <div className="mt-2">
                          <span className="font-medium">Warnings:</span> {parseResult.warnings.length}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 rounded-lg border-2 border-dashed border-purple-300 bg-purple-50/50 p-4 text-center">
                    <p className="text-sm text-purple-700">
                      <strong>Next Steps:</strong> The full analysis pipeline (AI-powered insights,
                      safety screening, attachment analysis) is coming soon!
                    </p>
                    <p className="mt-2 text-xs text-purple-600">
                      For now, you can see that your data was successfully parsed and validated.
                    </p>
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
                  Your privacy matters
                </h3>
                <p className="text-twilight-700">
                  File parsing happens in your browser. When you choose to analyze, we send your
                  data to our secure server for AI analysis, then immediately delete it after
                  generating your report. We never store your messages or personal information.
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
