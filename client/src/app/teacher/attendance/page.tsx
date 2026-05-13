"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, CheckCircle, XCircle, Clock } from "lucide-react";
import API from "@/lib/api";

type AttendanceStatus = "present" | "absent" | "late" | "leave";

export default function TeacherAttendancePage() {
  const qc = useQueryClient();
  const [selectedClass, setSelectedClass] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [saved, setSaved] = useState(false);

  const { data: classesData } = useQuery({
    queryKey: ["teacher-classes"],
    queryFn: () => API.classes.getClasses(),
  });

  const { data: classDetail, isLoading: loadingStudents } = useQuery({
    queryKey: ["class-detail", selectedClass],
    queryFn: () => API.classes.getClass(selectedClass),
    enabled: !!selectedClass,
  });

  const classes = (classesData as any)?.data?.data || (classesData as any)?.data || [];
  const students = (classDetail as any)?.data?.studentIds || (classDetail as any)?.studentIds || [];

  const markMutation = useMutation({
    mutationFn: API.attendance.markAttendance,
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 3000); },
  });

  const statusColors: Record<AttendanceStatus, string> = {
    present: "bg-green-100 border-green-300 text-green-700",
    absent: "bg-red-100 border-red-300 text-red-700",
    late: "bg-yellow-100 border-yellow-300 text-yellow-700",
    leave: "bg-blue-100 border-blue-300 text-blue-700",
  };

  const handleSubmit = () => {
    const records = students.map((s: any) => ({
      userId: s._id,
      status: attendance[s._id] || "present",
    }));
    markMutation.mutate({ classId: selectedClass, date, records });
  };

  const setAllStatus = (status: AttendanceStatus) => {
    const newAttendance: Record<string, AttendanceStatus> = {};
    students.forEach((s: any) => { newAttendance[s._id] = status; });
    setAttendance(newAttendance);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mark Attendance</h1>
        <p className="text-gray-500 text-sm">Record student attendance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
        <Select value={selectedClass} onValueChange={v => { setSelectedClass(v); setAttendance({}); }}>
          <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
          <SelectContent>
            {classes.map((c: any) => <SelectItem key={c._id} value={c._id}>{c.name} — {c.subject}</SelectItem>)}
          </SelectContent>
        </Select>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {selectedClass && (
        <>
          {loadingStudents ? (
            <div className="text-center py-8 text-gray-400">Loading students...</div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No students enrolled in this class</div>
          ) : (
            <>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="gap-1 text-xs text-green-700" onClick={() => setAllStatus("present")}>
                  <CheckCircle className="h-3 w-3" /> All Present
                </Button>
                <Button size="sm" variant="outline" className="gap-1 text-xs text-red-700" onClick={() => setAllStatus("absent")}>
                  <XCircle className="h-3 w-3" /> All Absent
                </Button>
              </div>

              <Card>
                <CardHeader><CardTitle className="text-base">{students.length} Students — {date}</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {students.map((s: any) => {
                    const status: AttendanceStatus = attendance[s._id] || "present";
                    return (
                      <div key={s._id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium text-sm">{s.name}</p>
                          <p className="text-xs text-gray-400">{s.userCode} · {s.email}</p>
                        </div>
                        <div className="flex gap-1">
                          {(["present", "absent", "late", "leave"] as AttendanceStatus[]).map((st) => (
                            <button
                              key={st}
                              onClick={() => setAttendance({ ...attendance, [s._id]: st })}
                              className={`px-2 py-1 rounded text-xs border capitalize transition-colors ${status === st ? statusColors[st] : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100"}`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <div className="flex items-center gap-3">
                <Button onClick={handleSubmit} disabled={markMutation.isPending}>
                  {markMutation.isPending ? "Saving..." : "Save Attendance"}
                </Button>
                {saved && <span className="text-sm text-green-600 flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Saved!</span>}
              </div>
            </>
          )}
        </>
      )}

      {!selectedClass && (
        <div className="text-center py-12 text-gray-400">
          <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Select a class to mark attendance</p>
        </div>
      )}
    </div>
  );
}
