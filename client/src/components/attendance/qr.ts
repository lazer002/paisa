/** Class codes: 8 characters from the server's unambiguous alphabet (no 0/O, 1/I). */
const CODE_PATTERN = /^[A-HJ-NP-Z2-9]{8}$/

/** The link a class QR encodes: scanning it opens attendance with the code filled in. */
export const attendanceLink = (code: string) =>
  `${window.location.origin}/dashboard/attendance?code=${encodeURIComponent(code)}`

/** The class code inside a scanned QR (our link) or typed text, or null. */
export function extractAttendanceCode(text: string | null | undefined): string | null {
  if (!text) return null
  let candidate = text.trim()

  try {
    const url = new URL(candidate)
    candidate = url.searchParams.get('code') ?? ''
  } catch {
    // Not a URL: the text itself may be the code.
  }

  const code = candidate.toUpperCase().replace(/[^A-Z0-9]/g, '')
  return CODE_PATTERN.test(code) ? code : null
}

/** In-page scanning needs the BarcodeDetector API (Chrome, Edge, Android) and a camera. */
export const canScanInPage = () =>
  typeof window !== 'undefined' && 'BarcodeDetector' in window && !!navigator.mediaDevices?.getUserMedia
