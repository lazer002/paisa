import { GraduationCap } from 'lucide-react'
import { useGetStudentsQuery } from '@/features/students/studentsApi'
import PageHeader from '@/components/ui/PageHeader'
import { LoadingList, ErrorState, EmptyState } from '@/components/ui/StateViews'
import Badge from '@/components/ui/badge'

export default function StudentsPage() {
  const { data: students, isLoading, isError, refetch } = useGetStudentsQuery()

  return (
    <div className="space-y-6">
      <PageHeader title="Students" subtitle="Student profiles and enrollment details" />

      {isLoading ? (
        <LoadingList rows={5} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !students?.length ? (
        <EmptyState
          icon={<GraduationCap size={48} />}
          title="No student profiles yet"
          hint="Create student user accounts first, then add student profiles (enrollment number, course, year) via the API"
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Enrollment No.</th>
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Year</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s: any) => (
                <tr key={s.publicId ?? s._id} className="border-b border-gray-50 transition hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900 text-sm font-bold text-white">
                        {(s.userId?.name ?? '?')?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{s.userId?.name ?? '—'}</p>
                        <p className="text-xs text-gray-400">{s.userId?.email ?? ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{s.enrollmentNumber}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{s.course ?? '—'}</td>
                  <td className="px-4 py-3"><Badge color="blue">{s.year ?? '—'}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
