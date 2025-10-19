/**
 * File Upload Zone Component
 *
 * Drag-and-drop file upload with validation and visual feedback
 */

import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { validateFile, formatFileSize, FileValidationResult } from '@lib/upload/validation'

export interface FileUploadZoneProps {
  onFileSelect: (file: File, validation: FileValidationResult) => void
  onError?: (error: string) => void
  disabled?: boolean
}

export default function FileUploadZone({
  onFileSelect,
  onError,
  disabled = false,
}: FileUploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [isDragReject, setIsDragReject] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    if (disabled) return

    setIsDragActive(true)

    // Check if dragged item is a file
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const item = e.dataTransfer.items[0]
      if (item.kind !== 'file') {
        setIsDragReject(true)
      }
    }
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    // Only reset if leaving the drop zone entirely
    if (e.currentTarget === e.target) {
      setIsDragActive(false)
      setIsDragReject(false)
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    setIsDragActive(false)
    setIsDragReject(false)

    if (disabled) return

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }

    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFile = (file: File) => {
    const validation = validateFile(file)

    if (!validation.valid && validation.error) {
      onError?.(validation.error)
      return
    }

    onFileSelect(file, validation)
  }

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  // Determine border and background colors based on state
  const getZoneClasses = () => {
    if (disabled) {
      return 'border-warm-200 bg-warm-50 cursor-not-allowed'
    }

    if (isDragReject) {
      return 'border-red-400 bg-red-50'
    }

    if (isDragActive) {
      return 'border-afterglow-500 bg-afterglow-50'
    }

    return 'border-warm-300 bg-white hover:border-afterglow-400 hover:bg-afterglow-50 cursor-pointer'
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`relative rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-200 ${getZoneClasses()} `}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip,.json,application/zip,application/x-zip-compressed,application/json"
        onChange={handleFileInputChange}
        disabled={disabled}
        className="hidden"
        aria-label="Upload file"
      />

      {/* Upload icon */}
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-afterglow-100">
        <svg
          className="h-8 w-8 text-afterglow-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
      </div>

      {/* Instructions */}
      <div className="space-y-2">
        <p className="font-display text-xl font-semibold text-warm-900">
          {isDragActive ? 'Drop your file here' : 'Drag and drop your dating app export'}
        </p>
        <p className="text-warm-600">or click to browse files</p>
        <p className="text-sm text-warm-500">
          Accepts ZIP or JSON files up to {formatFileSize(100 * 1024 * 1024)}
        </p>
      </div>

      {/* Privacy reminder */}
      <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-twilight-50 px-4 py-2 text-sm text-twilight-700">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <span>All processing happens on your device</span>
      </div>
    </div>
  )
}
