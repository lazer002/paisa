"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, TrendingUp } from "lucide-react";
import API from "@/lib/api";

const statusColors: Record<string, string> = {
  present: "bg-green-100 text-green-700",
  absent: "bg-red-100 text-red-700",
  late: "bg-yellow-100 text-yellow-700",
  leave: "bg-blue-100 text-blue-700",
};

export default function StudentAttendancePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-attendance"],
    queryFn: () => API.attendance.getMyAttendance(),
  });

  const records = (data as any)?.data?.records || (data as any)?.records || [];
  const summary = (data as any)?.data?.summary || (data as any)?.summary || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Attendance</h1>
        <p className="text-gray-500 text-sm">Track your attendance records</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Days", value: summary.total ?? "-", color: "text-gray-800" },
          { label: "Present", value: summary.present ?? "-", color: "text-green-700" },
          { label: "Absent", value: summary.absent ?? "-", color: "text-red-700" },
          { label: "Percentage", value: summary.percentage != null ? `${summary.percentage}%` : "-", color: "text-blue-700" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-400">Loading...</div>
      ) : records.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No attendance records yet</p>
        </div>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-base">Attendance History</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {records.map((r: any, i: number) => (
              <div key={r._id || i} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{new Date(r.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</p>
                  {r.classId?.name && <p className="text-xs text-gray-400">{r.classId.name}</p>}
                  {r.notes && <p className="text-xs text-gray-400">{r.notes}</p>}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[r.status] || "bg-gray-100 text-gray-700"}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
