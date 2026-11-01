import { useRef, useState } from 'react'
import { Download, ExternalLink, Paperclip, X } from 'lucide-react'

import {
  FILE_ACCEPT,
  MAX_FILE_SIZE_MB,
  checkFile,
  deleteStoredFile,
  downloadStoredFile,
  formatBytes,
  storedFileId,
  uploadFile,
  type FilePurpose,
  type StoredFile,
} from '@/lib/api/files'

interface FileUploadProps {
  purpose: FilePurpose
  value: StoredFile | null
  onChange: (file: StoredFile | null) => void
  disabled?: boolean
  /** Reports whether an upload is running so forms can wait for it. */
  onBusyChange?: (busy: boolean) => void
}

/**
 * Picks one file, checks it like the server does, uploads it to /api/files
 * with a progress bar and returns the stored file. Removing a file that was
 * uploaded here but not saved yet deletes it on the server.
 */
export default function FileUpload({ purpose, value, onChange, disabled, onBusyChange }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState('')

  const setBusy = (busy: boolean) => onBusyChange?.(busy)

  const pick = async (file: File | undefined) => {
    if (inputRef.current) inputRef.current.value = ''
    if (!file) return

    const problem = checkFile(file)
    if (problem) {
      setError(problem)
      return
    }

    setError('')
    setProgress(0)
    setBusy(true)
    try {
      onChange(await uploadFile(file, purpose, setProgress))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setProgress(null)
      setBusy(false)
    }
  }

  const remove = () => {
    if (value) deleteStoredFile(value.publicId).catch(() => {})
    onChange(null)
  }

  return (
    <div className="space-y-1.5">
      {value ? (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm">
          <span className="flex min-w-0 items-center gap-2 text-gray-700">
            <Paperclip size={14} className="flex-shrink-0 text-gray-400" />
            <span className="truncate">{value.originalName}</span>
            <span className="flex-shrink-0 text-xs text-gray-400">{formatBytes(value.size)}</span>
          </span>
          <button
            type="button"
            onClick={remove}
            disabled={disabled}
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            title="Remove file"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <label
          className={`flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 transition hover:border-gray-500 ${
            disabled || progress !== null ? 'pointer-events-none opacity-60' : ''
          }`}
        >
          <Paperclip size={14} />
          {progress !== null ? `Uploading… ${progress}%` : 'Choose a file'}
          <input
            ref={inputRef}
            type="file"
            accept={FILE_ACCEPT}
            className="hidden"
            disabled={disabled || progress !== null}
            onChange={(e) => pick(e.target.files?.[0])}
          />
        </label>
      )}

      {progress !== null && (
        <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full bg-black transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : (
        !value && (
          <p className="text-xs text-gray-400">
            PDF, images, Office files, TXT, CSV or ZIP · up to {MAX_FILE_SIZE_MB} MB
          </p>
        )
      )}
    </div>
  )
}

interface FileLinkProps {
  url: string
  fileName?: string
  label?: string
  className?: string
}

/**
 * Opens an external link in a new tab, or downloads a stored file
 * (/api/files/:id/download) through the authenticated API.
 */
export function FileLink({ url, fileName, label = 'Open', className = '' }: FileLinkProps) {
  const fileId = storedFileId(url)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!fileId) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 ${className}`}>
        {label} <ExternalLink size={11} />
      </a>
    )
  }

  const download = async () => {
    setBusy(true)
    setError('')
    try {
      await downloadStoredFile(fileId, fileName)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={download}
      disabled={busy}
      title={error || undefined}
      className={`inline-flex items-center gap-1 ${error ? 'text-red-600' : ''} ${className}`}
    >
      {busy ? 'Downloading…' : error ? 'Unavailable' : 'Download'} <Download size={11} />
    </button>
  )
}
