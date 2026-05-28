import { Wallet } from 'lucide-react'

export default function PayrollPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payroll</h1>
        <p className="text-sm text-gray-500">Process and manage employee payroll</p>
      </div>
      <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 text-center shadow-sm">
        <Wallet size={48} className="mb-4 text-gray-200" />
        <h3 className="font-semibold text-gray-500">Coming Soon</h3>
        <p className="mt-1 text-sm text-gray-400">Payroll processing is under development</p>
      </div>
    </div>
  )
}
