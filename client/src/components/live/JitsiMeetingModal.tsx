import { useEffect, useRef, useState } from 'react'
import { ExternalLink, X } from 'lucide-react'

import type { LiveSessionJoin } from '@/features/liveSessions/liveSessionsApi'

interface JitsiApi {
  dispose: () => void
  addListener: (event: string, handler: () => void) => void
}

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (domain: string, options: Record<string, unknown>) => JitsiApi
  }
}

const loadedScripts = new Map<string, Promise<void>>()

const loadScript = (src: string) => {
  const existing = loadedScripts.get(src)
  if (existing) return existing
  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      loadedScripts.delete(src)
      reject(new Error('Could not load the video meeting'))
    }
    document.body.appendChild(script)
  })
  loadedScripts.set(src, promise)
  return promise
}

/** Embedded Jitsi meeting (external API) with an "open in new tab" fallback. */
export default function JitsiMeetingModal({ join, onClose }: { join: LiveSessionJoin; onClose: () => void }) {
  const container = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!join.jitsi) return
    let api: JitsiApi | null = null
    let cancelled = false

    loadScript(join.jitsi.scriptUrl)
      .then(() => {
        if (cancelled || !container.current || !window.JitsiMeetExternalAPI || !join.jitsi) return
        api = new window.JitsiMeetExternalAPI(join.jitsi.domain, {
          roomName: join.jitsi.roomName,
          parentNode: container.current,
          width: '100%',
          height: '100%',
          userInfo: { displayName: join.displayName },
          configOverwrite: { prejoinPageEnabled: false, subject: join.title },
        })
        api.addListener('readyToClose', onClose)
      })
      .catch((e: Error) => setError(e.message))

    return () => {
      cancelled = true
      api?.dispose()
    }
  }, [join, onClose])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/80 p-2 sm:p-4">
      <div className="flex items-center justify-between gap-3 rounded-t-xl bg-gray-900 px-4 py-2 text-white">
        <p className="truncate text-sm font-medium">{join.title}</p>
        <div className="flex items-center gap-2">
          <a
            href={join.joinUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-gray-300 hover:bg-white/10 hover:text-white"
          >
            <ExternalLink size={13} /> Open in new tab
          </a>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-300 hover:bg-white/10 hover:text-white" aria-label="Leave meeting">
            <X size={16} />
          </button>
        </div>
      </div>
      <div ref={container} className="flex-1 overflow-hidden rounded-b-xl bg-black">
        {error && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-gray-300">
            <p>{error}</p>
            <a href={join.joinUrl} target="_blank" rel="noreferrer" className="underline">Open the meeting in a new tab</a>
          </div>
        )}
      </div>
    </div>
  )
}
