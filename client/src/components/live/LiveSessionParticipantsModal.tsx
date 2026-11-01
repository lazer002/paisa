import { useGetLiveSessionParticipantsQuery } from '@/features/liveSessions/liveSessionsApi'
import { ModalShell, StatusBadge } from '@/components/ui/kit'

/** Host view: who joined the session and when (attendance). */
export default function LiveSessionParticipantsModal({
  sessionId, title, onClose,
}: { sessionId: string; title: string; onClose: () => void }) {
  const { data, isLoading, isError } = useGetLiveSessionParticipantsQuery(sessionId)

  return (
    <ModalShell open onClose={onClose} title={`Participants · ${title}`} size="lg">
      {isLoading ? (
        <p className="py-6 text-center text-sm text-gray-400">Loading...</p>
      ) : isError ? (
        <p className="py-6 text-center text-sm text-gray-500">Could not load participants.</p>
      ) : !data?.length ? (
        <p className="py-6 text-center text-sm text-gray-400">Nobody has joined yet.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
              <th className="py-2 font-medium">Name</th>
              <th className="py-2 font-medium">Role</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium">First joined</th>
              <th className="py-2 font-medium">Joins</th>
            </tr>
          </thead>
          <tbody>
            {data.map((p, i) => (
              <tr key={p.user?.publicId ?? i} className="border-b border-gray-50">
                <td className="py-2">
                  <p className="font-medium text-gray-900">{p.user?.name ?? 'Unknown'}</p>
                  <p className="text-xs text-gray-400">{p.user?.email}</p>
                </td>
                <td className="py-2 capitalize text-gray-600">{p.user?.role ?? p.role}</td>
                <td className="py-2"><StatusBadge status={p.status} /></td>
                <td className="py-2 text-gray-600">{p.joinedAt ? new Date(p.joinedAt).toLocaleString() : '—'}</td>
                <td className="py-2 text-gray-600">{p.connectionCount ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </ModalShell>
  )
}
