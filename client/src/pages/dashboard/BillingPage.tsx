import { FileText } from 'lucide-react'

export default function BillingPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="text-sm text-gray-500">Manage invoices, plans, and payments</p>
      </div>
      <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 text-center shadow-sm">
        <FileText size={48} className="mb-4 text-gray-200" />
        <h3 className="font-semibold text-gray-500">Coming Soon</h3>
        <p className="mt-1 text-sm text-gray-400">Billing module is under development</p>
      </div>
    </div>
  )
}
