"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, GraduationCap, Briefcase, Megaphone, Calendar, AlertCircle, UserCog, Plus } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import API from "@/lib/api";
import Link from "next/link";

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, annRes] = await Promise.all([
          API.stats.getAdminStats(),
          API.announcements.getAnnouncements(),
        ]);
        setStats(statsRes.data?.data || statsRes.data);
        setAnnouncements((annRes.data?.data || annRes.data || []).slice(0, 5));
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const statCards = [
    { title: "Teachers", value: stats?.teachers ?? "-", icon: <GraduationCap className="w-5 h-5 text-blue-500" />, color: "text-blue-600", href: "/admin/users" },
    { title: "Students", value: stats?.students ?? "-", icon: <Users className="w-5 h-5 text-purple-500" />, color: "text-purple-600", href: "/admin/users" },
    { title: "Employees", value: stats?.employees ?? "-", icon: <Briefcase className="w-5 h-5 text-emerald-500" />, color: "text-emerald-600", href: "/admin/users" },
    { title: "HR Staff", value: stats?.hr ?? "-", icon: <UserCog className="w-5 h-5 text-orange-500" />, color: "text-orange-600", href: "/admin/users" },
    { title: "Announcements", value: stats?.announcements ?? "-", icon: <Megaphone className="w-5 h-5 text-pink-500" />, color: "text-pink-600", href: "/admin/announcements" },
    { title: "Pending Leaves", value: stats?.pendingLeaves ?? "-", icon: <AlertCircle className="w-5 h-5 text-red-500" />, color: "text-red-600", href: "/admin/users" },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}</h1>
        <p className="text-gray-500 text-sm mt-1">Admin Dashboard</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((s) => (
          <Link href={s.href} key={s.title}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-gray-500">{s.title}</CardTitle>
                {s.icon}
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Link href="/admin/users">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Plus className="h-4 w-4" /> Add User
              </Button>
            </Link>
            <Link href="/admin/classes">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Plus className="h-4 w-4" /> Add Class
              </Button>
            </Link>
            <Link href="/admin/announcements">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Megaphone className="h-4 w-4" /> Announce
              </Button>
            </Link>
            <Link href="/admin/attendance">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Calendar className="h-4 w-4" /> Attendance
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Announcements</CardTitle>
            <Link href="/admin/announcements">
              <Button variant="ghost" size="sm" className="text-xs">View all</Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {announcements.length === 0 ? (
              <p className="text-sm text-gray-400">No announcements yet</p>
            ) : (
              announcements.map((a: any) => (
                <div key={a._id} className="flex items-start gap-3 p-2 rounded-lg bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{a.title}</p>
                    <p className="text-xs text-gray-500 truncate">{a.content}</p>
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
    </div>
  );
}
