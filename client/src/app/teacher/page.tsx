"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, PenSquare, CheckSquare, Megaphone, Plus, Users } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import API from "@/lib/api";
import Link from "next/link";

export default function TeacherDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [recentAssignments, setRecentAssignments] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, assRes, annRes] = await Promise.all([
          API.stats.getTeacherStats(),
          API.assignments.getAssignments(),
          API.announcements.getAnnouncements(),
        ]);
        setStats(statsRes.data?.data || statsRes.data);
        setRecentAssignments((assRes.data?.data || assRes.data || []).slice(0, 5));
        setAnnouncements((annRes.data?.data || annRes.data || []).slice(0, 3));
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const statCards = [
    { title: "My Classes", value: stats?.myClasses ?? "-", icon: <BookOpen className="w-5 h-5 text-emerald-500" />, href: "/teacher/classes" },
    { title: "Assignments", value: stats?.myAssignments ?? "-", icon: <PenSquare className="w-5 h-5 text-blue-500" />, href: "/teacher/assignments" },
    { title: "Pending Reviews", value: stats?.pendingSubmissions ?? "-", icon: <CheckSquare className="w-5 h-5 text-orange-500" />, href: "/teacher/assignments" },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}</h1>
        <p className="text-gray-500 text-sm mt-1">Teacher Dashboard — {user?.userCode}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((s) => (
          <Link href={s.href} key={s.title}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-gray-500">{s.title}</CardTitle>
                {s.icon}
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-2xl font-bold text-gray-800">{s.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Link href="/teacher/assignments">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Plus className="h-4 w-4" /> New Assignment
              </Button>
            </Link>
            <Link href="/teacher/attendance">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Users className="h-4 w-4" /> Mark Attendance
              </Button>
            </Link>
            <Link href="/teacher/materials">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Plus className="h-4 w-4" /> Upload Material
              </Button>
            </Link>
            <Link href="/teacher/classes">
              <Button variant="outline" className="w-full justify-start gap-2">
                <BookOpen className="h-4 w-4" /> My Classes
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Assignments</CardTitle>
            <Link href="/teacher/assignments">
              <Button variant="ghost" size="sm" className="text-xs">View all</Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentAssignments.length === 0 ? (
              <p className="text-sm text-gray-400">No assignments yet</p>
            ) : (
              recentAssignments.map((a: any) => (
                <div key={a._id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">{a.title}</p>
                    <p className="text-xs text-gray-500">{a.classId?.name || "—"}</p>
                  </div>
                  <Badge variant={a.status === "published" ? "default" : "outline"} className="text-xs ml-2 shrink-0">
                    {a.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Announcements</CardTitle>
          <Link href="/teacher/announcements">
            <Button variant="ghost" size="sm" className="text-xs">View all</Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-2">
          {announcements.length === 0 ? (
            <p className="text-sm text-gray-400">No announcements</p>
          ) : (
            announcements.map((a: any) => (
              <div key={a._id} className="flex items-start gap-3 p-2 rounded-lg bg-gray-50">
                <Megaphone className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800">{a.title}</p>
                  <p className="text-xs text-gray-500 line-clamp-1">{a.content}</p>
                </div>
                <Badge variant={a.priority === "high" ? "destructive" : "outline"} className="text-xs shrink-0">
                  {a.priority}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
