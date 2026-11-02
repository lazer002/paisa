export interface SessionInfo {
  id: string
  ip: string | null
  userAgent: string | null
  createdAt: string
  lastUsedAt: string
  expiresAt: string
  current?: boolean
}

const BROWSERS: [RegExp, string][] = [
  [/Edg\//, 'Edge'],
  [/OPR\/|Opera/, 'Opera'],
  [/Firefox\//, 'Firefox'],
  [/Chrome\//, 'Chrome'],
  [/Safari\//, 'Safari'],
  [/node|undici|curl|axios|Postman/i, 'API client'],
]

const SYSTEMS: [RegExp, string][] = [
  [/Windows/, 'Windows'],
  [/Android/, 'Android'],
  [/iPhone|iPad|iOS/, 'iOS'],
  [/Mac OS X|Macintosh/, 'macOS'],
  [/Linux/, 'Linux'],
]

/** "Chrome on Windows" from a user-agent string. */
export function describeDevice(userAgent: string | null): string {
  if (!userAgent) return 'Unknown device'
  const browser = BROWSERS.find(([re]) => re.test(userAgent))?.[1]
  const system = SYSTEMS.find(([re]) => re.test(userAgent))?.[1]
  if (browser && system) return `${browser} on ${system}`
  return browser ?? system ?? 'Unknown device'
}

/** "5 min ago", "3 h ago", "2 days ago". */
export function timeAgo(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}
