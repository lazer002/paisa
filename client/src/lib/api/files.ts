// client/src/lib/api/files.ts
//
// Uploads and downloads through /api/files. Uses the shared axios instance
// so the Bearer token and the 401 → refresh → retry behaviour apply.
// The size/type rules mirror server/src/services/storage/fileRules.js.

import api from '@/lib/api/axios'

export type FilePurpose = 'employee_document' | 'study_material' | 'submission' | 'avatar' | 'chat_attachment'

export interface StoredFile {
  _id: string
  publicId: string
  originalName: string
  mimeType: string
  extension: string
  size: number
  purpose: FilePurpose
  downloadUrl: string
}

/** Server default MAX_FILE_SIZE_MB; override with VITE_MAX_FILE_SIZE_MB if the server differs. */
export const MAX_FILE_SIZE_MB = Number(import.meta.env.VITE_MAX_FILE_SIZE_MB ?? 10) || 10

/** extension → MIME types the server accepts for it. */
const ALLOWED: Record<string, string[]> = {
  pdf: ['application/pdf'],
  png: ['image/png'],
  jpg: ['image/jpeg', 'image/pjpeg'],
  jpeg: ['image/jpeg', 'image/pjpeg'],
  webp: ['image/webp'],
  doc: ['application/msword'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  xls: ['application/vnd.ms-excel'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  ppt: ['application/vnd.ms-powerpoint'],
  pptx: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  txt: ['text/plain'],
  csv: ['text/csv', 'application/csv', 'text/plain', 'application/vnd.ms-excel'],
  zip: ['application/zip', 'application/x-zip-compressed'],
}

export const ALLOWED_EXTENSIONS = Object.keys(ALLOWED)

export const FILE_ACCEPT = ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(',')

export const formatBytes = (bytes: number) =>
  bytes < 1024
    ? `${bytes} B`
    : bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`

/** Same checks as the server; returns an error message or null. */
export const checkFile = (file: File): string | null => {
  const ext = /\.([a-z0-9]{1,8})$/i.exec(file.name)?.[1]?.toLowerCase() ?? ''
  const mimes = ALLOWED[ext]

  if (!mimes) return `File type not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`
  if (file.size === 0) return 'The file is empty'
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) return `File is larger than ${MAX_FILE_SIZE_MB} MB`
  // Some browsers send no type for less common extensions; the server re-checks.
  if (file.type && !mimes.includes(file.type)) return 'File content type does not match its extension'

  return null
}

const apiMessage = async (error: unknown, fallback: string) => {
  const data = (error as { response?: { data?: unknown } })?.response?.data

  if (data instanceof Blob) {
    try {
      return (JSON.parse(await data.text()) as { message?: string }).message ?? fallback
    } catch {
      return fallback
    }
  }

  return (data as { message?: string } | undefined)?.message ?? fallback
}

export async function uploadFile(
  file: File,
  purpose: FilePurpose,
  onProgress?: (percent: number) => void,
): Promise<StoredFile> {
  const form = new FormData()
  form.append('purpose', purpose)
  form.append('file', file)

  let message: string
  try {
    const res = await api.post<{ data: StoredFile }>('/files', form, {
      onUploadProgress: (event) => {
        if (onProgress && event.total) onProgress(Math.round((event.loaded / event.total) * 100))
      },
    })
    return res.data.data
  } catch (error) {
    message = await apiMessage(error, 'Upload failed')
  }
  throw new Error(message)
}

export async function deleteStoredFile(publicId: string) {
  await api.delete(`/files/${publicId}`)
}

/** The file publicId inside a stored-file download path, or null for an external link. */
export const storedFileId = (url?: string | null) =>
  url ? /\/files\/(file_[A-Za-z0-9_-]+)\/download$/.exec(url)?.[1] ?? null : null

/** Fetches a stored file with auth and hands it to the browser as a download. */
export async function downloadStoredFile(publicId: string, fileName = 'download') {
  let message: string
  try {
    const res = await api.get<Blob>(`/files/${publicId}/download`, { responseType: 'blob' })
    const href = URL.createObjectURL(res.data)
    const link = document.createElement('a')
    link.href = href
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(href), 1000)
    return
  } catch (error) {
    message = await apiMessage(error, 'Download failed')
  }
  throw new Error(message)
}
