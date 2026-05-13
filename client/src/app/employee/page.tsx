"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Wallet, TrendingUp, Megaphone, Plus, User } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import API from "@/lib/api";
import Link from "next/link";

export default function EmployeeDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [myLeaves, setMyLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, annRes, leavesRes] = await Promise.all([
          API.stats.getEmployeeStats(),
          API.announcements.getAnnouncements(),
          API.leaves.getLeaves(),
        ]);
        setStats(statsRes.data?.data || statsRes.data);
        setAnnouncements((annRes.data?.data || annRes.data || []).slice(0, 3));
        setMyLeaves((leavesRes.data?.data || leavesRes.data || []).slice(0, 3));
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const statCards = [
    { title: "My Leaves", value: stats?.myLeaves ?? "-", icon: <Calendar className="w-5 h-5 text-blue-500" />, href: "/employee/leaves" },
    { title: "Pending Leaves", value: stats?.pendingLeaves ?? "-", icon: <Calendar className="w-5 h-5 text-orange-500" />, href: "/employee/leaves" },
    { title: "Payslips", value: stats?.myPayslips ?? "-", icon: <Wallet className="w-5 h-5 text-green-500" />, href: "/employee/payslips" },
    { title: "Attendance", value: stats?.attendancePercent != null ? `${stats.attendancePercent}%` : "-", icon: <TrendingUp className="w-5 h-5 text-purple-500" />, href: "/employee" },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}</h1>
        <p className="text-gray-500 text-sm mt-1">Employee Portal — {user?.userCode}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
            <Link href="/employee/leaves">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Plus className="h-4 w-4" /> Apply Leave
              </Button>
            </Link>
            <Link href="/employee/payslips">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Wallet className="h-4 w-4" /> View Payslips
              </Button>
            </Link>
            <Link href="/employee/announcements">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Megaphone className="h-4 w-4" /> Announcements
              </Button>
            </Link>
            <Link href="/employee/profile">
              <Button variant="outline" className="w-full justify-start gap-2">
                <User className="h-4 w-4" /> My Profile
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Announcements</CardTitle>
            <Link href="/employee/announcements">
              <Button variant="ghost" size="sm" className="text-xs">View all</Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {announcements.length === 0 ? (
              <p className="text-sm text-gray-400">No announcements</p>
            ) : (
              announcements.map((a: any) => (
                <div key={a._id} className="flex items-start gap-3 p-2 rounded-lg bg-gray-50">
                  <Megaphone className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
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

      {myLeaves.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">My Recent Leaves</CardTitle>
            <Link href="/employee/leaves">
              <Button variant="ghost" size="sm" className="text-xs">View all</Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {myLeaves.map((l: any) => (
              <div key={l._id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                <div>
                  <p className="text-sm font-medium capitalize">{l.type} Leave</p>
                  <p className="text-xs text-gray-500">
                    {new Date(l.startDate).toLocaleDateString()} — {new Date(l.endDate).toLocaleDateString()} ({l.days} day(s))
                  </p>
                </div>
                <Badge
                  variant={l.status === "approved" ? "default" : l.status === "rejected" ? "destructive" : "outline"}
                  className="text-xs capitalize"
                >
                  {l.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
