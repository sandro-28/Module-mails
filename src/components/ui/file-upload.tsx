"use client"

import * as React from "react"
import { useDropzone, type Accept } from "react-dropzone"
import { UploadCloud, File, X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface FileUploadProps {
  /** MIME types to accept (e.g. { "text/csv": [".csv"] }) */
  accept?: Accept
  /** Maximum file size in bytes */
  maxSize?: number
  /** Allow multiple files */
  multiple?: boolean
  /** Called when files are selected / dropped */
  onFilesSelected: (files: File[]) => void
  /** Additional class for the container */
  className?: string
  /** Disable the dropzone */
  disabled?: boolean
}

export function FileUpload({
  accept,
  maxSize,
  multiple = false,
  onFilesSelected,
  className,
  disabled = false,
}: FileUploadProps) {
  const [files, setFiles] = React.useState<File[]>([])

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      accept,
      maxSize,
      multiple,
      disabled,
      onDrop: (accepted) => {
        setFiles(accepted)
        onFilesSelected(accepted)
      },
    })

  function removeFile(index: number) {
    const next = files.filter((_, i) => i !== index)
    setFiles(next)
    onFilesSelected(next)
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
          isDragActive
            ? "border-indigo-400 bg-indigo-50"
            : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100",
          disabled && "pointer-events-none opacity-50"
        )}
        role="button"
        aria-label="File upload dropzone"
        tabIndex={0}
      >
        <input {...getInputProps()} />
        <UploadCloud
          className={cn(
            "mb-3 h-10 w-10",
            isDragActive ? "text-indigo-500" : "text-gray-400"
          )}
          aria-hidden="true"
        />
        {isDragActive ? (
          <p className="text-sm font-medium text-indigo-600">
            Drop files here...
          </p>
        ) : (
          <>
            <p className="text-sm font-medium text-gray-700">
              Drag and drop files here, or click to browse
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {maxSize
                ? `Max file size: ${formatSize(maxSize)}`
                : "Any file size"}
              {multiple ? " - multiple files allowed" : ""}
            </p>
          </>
        )}
      </div>

      {/* Rejection errors */}
      {fileRejections.length > 0 && (
        <div className="mt-2 space-y-1">
          {fileRejections.map(({ file, errors }, i) => (
            <p key={`${file.name}-${i}`} className="text-sm text-red-600">
              {file.name}: {errors.map((e) => e.message).join(", ")}
            </p>
          ))}
        </div>
      )}

      {/* Accepted file list */}
      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 rounded-md border border-gray-200 bg-white px-3 py-2"
            >
              <File className="h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
              <div className="flex-1 truncate text-sm text-gray-700">
                {file.name}{" "}
                <span className="text-gray-400">({formatSize(file.size)})</span>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="rounded-sm p-0.5 text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
