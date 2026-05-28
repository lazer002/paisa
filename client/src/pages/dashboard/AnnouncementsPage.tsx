import { Megaphone } from 'lucide-react'

export default function AnnouncementsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
        <p className="text-sm text-gray-500">Broadcast messages across the platform</p>
      </div>
      <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 text-center shadow-sm">
        <Megaphone size={48} className="mb-4 text-gray-200" />
        <h3 className="font-semibold text-gray-500">Coming Soon</h3>
        <p className="mt-1 text-sm text-gray-400">Announcements module is under development</p>
      </div>
    </div>
  )
}
