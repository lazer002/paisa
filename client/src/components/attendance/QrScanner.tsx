import { useEffect, useRef, useState } from 'react'

import { extractAttendanceCode } from './qr'

// Minimal typing for the BarcodeDetector web API (not in TypeScript's DOM lib).
interface DetectedBarcode {
  rawValue: string
}
interface BarcodeDetectorLike {
  detect(source: HTMLVideoElement): Promise<DetectedBarcode[]>
}
type BarcodeDetectorCtor = new (options: { formats: string[] }) => BarcodeDetectorLike

/**
 * Live camera view that reports the first class code it reads from a QR.
 * Only rendered where canScanInPage() is true.
 */
export default function QrScanner({ onCode, onClose }: { onCode: (code: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let stream: MediaStream | null = null
    let timer: number | null = null
    let stopped = false

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (stopped || !videoRef.current) return
        videoRef.current.srcObject = stream
        await videoRef.current.play()

        const Detector = (window as unknown as { BarcodeDetector: BarcodeDetectorCtor }).BarcodeDetector
        const detector = new Detector({ formats: ['qr_code'] })

        const scan = async () => {
          if (stopped || !videoRef.current) return
          try {
            const found = await detector.detect(videoRef.current)
            const code = found.map((b) => extractAttendanceCode(b.rawValue)).find(Boolean)
            if (code) {
              onCode(code)
              return
            }
          } catch {
            // A frame that cannot be read yet; keep trying.
          }
          timer = window.setTimeout(scan, 300)
        }

        void scan()
      } catch {
        setError('Camera not available. Allow camera access, or type the code instead.')
      }
    }

    void start()

    return () => {
      stopped = true
      if (timer) window.clearTimeout(timer)
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [onCode])

  return (
    <div className="space-y-2">
      {error ? (
        <p className="text-sm text-rose-600">{error}</p>
      ) : (
        <video ref={videoRef} muted playsInline className="aspect-square w-full max-w-xs rounded-xl bg-black object-cover" />
      )}
      <button type="button" onClick={onClose} className="text-sm text-gray-600 underline hover:text-black">
        Close camera
      </button>
    </div>
  )
}
