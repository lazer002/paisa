"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Wallet, Calendar, Building2, AlertCircle, Plus } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import API from "@/lib/api";
import Link from "next/link";

export default function HRDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, leavesRes] = await Promise.all([
          API.stats.getHRStats(),
          API.leaves.getLeaves({ status: "pending" }),
        ]);
        setStats(statsRes.data?.data || statsRes.data);
        setPendingLeaves((leavesRes.data?.data || leavesRes.data || []).slice(0, 5));
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const statCards = [
    { title: "Employees", value: stats?.employees ?? "-", icon: <Users className="w-5 h-5 text-blue-500" />, href: "/hr/employees" },
    { title: "Departments", value: stats?.departments ?? "-", icon: <Building2 className="w-5 h-5 text-green-500" />, href: "/hr/departments" },
    { title: "Pending Leaves", value: stats?.pendingLeaves ?? "-", icon: <AlertCircle className="w-5 h-5 text-orange-500" />, href: "/hr/leaves" },
    { title: "Paid Payrolls", value: stats?.processedPayrolls ?? "-", icon: <Wallet className="w-5 h-5 text-emerald-500" />, href: "/hr/payroll" },
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
        <p className="text-gray-500 text-sm mt-1">HR Dashboard — manage workforce</p>
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
            <Link href="/hr/payroll">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Plus className="h-4 w-4" /> Process Payroll
              </Button>
            </Link>
            <Link href="/hr/leaves">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Calendar className="h-4 w-4" /> Review Leaves
              </Button>
            </Link>
            <Link href="/hr/employees">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Users className="h-4 w-4" /> Employees
              </Button>
            </Link>
            <Link href="/hr/departments">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Building2 className="h-4 w-4" /> Departments
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Pending Leave Requests</CardTitle>
            <Link href="/hr/leaves">
              <Button variant="ghost" size="sm" className="text-xs">View all</Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingLeaves.length === 0 ? (
              <p className="text-sm text-gray-400">No pending leave requests</p>
            ) : (
              pendingLeaves.map((l: any) => (
                <div key={l._id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">{l.userId?.name || "—"}</p>
                    <p className="text-xs text-gray-500 capitalize">{l.type} · {l.days} day(s)</p>
                  </div>
                  <Badge variant="outline" className="text-xs ml-2 shrink-0 text-orange-600 border-orange-300">
                    Pending
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
