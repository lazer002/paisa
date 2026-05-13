"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  School, Building2, Users, GraduationCap,
  Briefcase, UserCog, Activity, TrendingUp,
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import API from "@/lib/api";

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ["superadmin-stats"],
    queryFn: () => API.stats.getSuperAdminStats(),
  });

  const stats = (data as any)?.data?.data || (data as any)?.data || {};

  const statCards = [
    { title: "Organizations", value: stats.organizations ?? 0, icon: Building2, color: "text-blue-500" },
    { title: "Total Users", value: stats.users ?? 0, icon: Users, color: "text-purple-500" },
    { title: "Teachers", value: stats.teachers ?? 0, icon: GraduationCap, color: "text-orange-500" },
    { title: "Students", value: stats.students ?? 0, icon: Users, color: "text-indigo-500" },
    { title: "Employees", value: stats.employees ?? 0, icon: Briefcase, color: "text-emerald-500" },
    { title: "HR Staff", value: stats.hr ?? 0, icon: UserCog, color: "text-rose-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name}!</h1>
          <p className="text-muted-foreground">Super Admin — platform overview</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Activity className="w-4 h-4" />
          <span>{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.title}</CardTitle>
                <Icon className={`w-5 h-5 ${s.color}`} />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
                ) : (
                  <div className="text-3xl font-bold">{s.value}</div>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <TrendingUp className="w-3 h-3 text-green-500" />
                  <span className="text-green-500">Active</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Organizations", desc: "Manage organizations", icon: Building2, color: "text-blue-500" },
              { label: "Users", desc: "Manage all users", icon: Users, color: "text-purple-500" },
              { label: "Institutes", desc: "Education institutes", icon: School, color: "text-green-500" },
              { label: "Reports", desc: "View platform reports", icon: Activity, color: "text-orange-500" },
            ].map((a) => {
              const Icon = a.icon;
              return (
                <button key={a.label} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left">
                  <Icon className={`w-8 h-8 mb-2 ${a.color}`} />
                  <div className="font-medium text-sm">{a.label}</div>
                  <div className="text-xs text-muted-foreground">{a.desc}</div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
