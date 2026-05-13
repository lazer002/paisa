"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ClipboardList } from "lucide-react";
import API from "@/lib/api";

const statusColors: Record<string, string> = {
  present: "bg-green-100 text-green-700",
  absent: "bg-red-100 text-red-700",
  late: "bg-yellow-100 text-yellow-700",
  leave: "bg-blue-100 text-blue-700",
};

export default function AdminAttendancePage() {
  const [selectedClass, setSelectedClass] = useState("all");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: classesData } = useQuery({
    queryKey: ["admin-classes"],
    queryFn: () => API.classes.getClasses(),
  });

  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ["admin-attendance", selectedClass, date],
    queryFn: () =>
      API.attendance.getAttendance({
        ...(selectedClass !== "all" && { classId: selectedClass }),
        date,
      }),
  });

  const classes = (classesData as any)?.data?.data || (classesData as any)?.data || [];
  const records = (attendanceData as any)?.data?.data || (attendanceData as any)?.data || [];

  const summary = {
    present: records.filter((r: any) => r.status === "present").length,
    absent: records.filter((r: any) => r.status === "absent").length,
    late: records.filter((r: any) => r.status === "late").length,
    leave: records.filter((r: any) => r.status === "leave").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Attendance Overview</h1>
        <p className="text-gray-500 text-sm">View attendance records across all classes</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger><SelectValue placeholder="All Classes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map((c: any) => (
              <SelectItem key={c._id} value={c._id}>{c.name} — {c.subject}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Present", value: summary.present, color: "text-green-700" },
          { label: "Absent", value: summary.absent, color: "text-red-700" },
          { label: "Late", value: summary.late, color: "text-yellow-700" },
          { label: "On Leave", value: summary.leave, color: "text-blue-700" },
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
          <p>No attendance records for this date</p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{records.length} Records — {new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {records.map((r: any, i: number) => (
              <div key={r._id || i} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{r.userId?.name || "—"}</p>
                  <p className="text-xs text-gray-400">
                    {r.userId?.userCode} · {r.classId?.name || "No class"}
                  </p>
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
