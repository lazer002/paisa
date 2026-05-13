"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Wallet, Calendar, BarChart2, TrendingUp, TrendingDown } from "lucide-react";
import API from "@/lib/api";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function HRReportsPage() {
  const { data: statsData } = useQuery({
    queryKey: ["hr-stats-reports"],
    queryFn: () => API.stats.getHRStats(),
  });

  const { data: payrollData } = useQuery({
    queryKey: ["hr-payroll-reports"],
    queryFn: () => API.payroll.getPayrolls({}),
  });

  const { data: leavesData } = useQuery({
    queryKey: ["hr-leaves-reports"],
    queryFn: () => API.leaves.getLeaves({}),
  });

  const { data: deptData } = useQuery({
    queryKey: ["hr-departments-reports"],
    queryFn: () => API.departments.getDepartments(),
  });

  const stats = (statsData as any)?.data?.data || (statsData as any)?.data || {};
  const payrolls = (payrollData as any)?.data?.data || (payrollData as any)?.data || [];
  const leaves = (leavesData as any)?.data?.data || (leavesData as any)?.data || [];
  const departments = (deptData as any)?.data?.data || (deptData as any)?.data || [];

  const totalPayroll = payrolls
    .filter((p: any) => p.status === "paid")
    .reduce((sum: number, p: any) => sum + (p.netSalary || 0), 0);

  const leaveByType: Record<string, number> = {};
  leaves.forEach((l: any) => {
    leaveByType[l.type] = (leaveByType[l.type] || 0) + 1;
  });

  const leaveByStatus = {
    pending: leaves.filter((l: any) => l.status === "pending").length,
    approved: leaves.filter((l: any) => l.status === "approved").length,
    rejected: leaves.filter((l: any) => l.status === "rejected").length,
  };

  const payrollByMonth: Record<number, number> = {};
  payrolls.forEach((p: any) => {
    if (p.status === "paid") {
      payrollByMonth[p.month] = (payrollByMonth[p.month] || 0) + (p.netSalary || 0);
    }
  });

  const currentMonth = new Date().getMonth() + 1;
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const currentMonthPayroll = payrollByMonth[currentMonth] || 0;
  const prevMonthPayroll = payrollByMonth[prevMonth] || 0;
  const payrollChange = prevMonthPayroll > 0
    ? Math.round(((currentMonthPayroll - prevMonthPayroll) / prevMonthPayroll) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">HR Reports</h1>
        <p className="text-gray-500 text-sm">Overview of workforce, payroll, and leave data</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Employees", value: stats.employees ?? payrolls.length, icon: Users, color: "text-blue-600" },
          { label: "Departments", value: departments.length, icon: BarChart2, color: "text-purple-600" },
          { label: "Total Payroll Paid", value: `₹${(totalPayroll / 1000).toFixed(0)}K`, icon: Wallet, color: "text-green-600" },
          { label: "Pending Leaves", value: leaveByStatus.pending, icon: Calendar, color: "text-orange-600" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <Icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Wallet className="h-4 w-4" /> Payroll by Month</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Object.keys(payrollByMonth).length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No paid payroll records yet</p>
            ) : (
              Object.entries(payrollByMonth)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([month, total]) => {
                  const maxVal = Math.max(...Object.values(payrollByMonth));
                  const pct = maxVal > 0 ? Math.round((total / maxVal) * 100) : 0;
                  return (
                    <div key={month}>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{months[Number(month) - 1]}</span>
                        <span>₹{total.toLocaleString()}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
            )}
            {prevMonthPayroll > 0 && (
              <div className={`flex items-center gap-1 text-xs mt-2 ${payrollChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                {payrollChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span>{Math.abs(payrollChange)}% vs last month</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4" /> Leave Summary</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {[
                { label: "Approved", value: leaveByStatus.approved, color: "bg-green-400" },
                { label: "Pending", value: leaveByStatus.pending, color: "bg-yellow-400" },
                { label: "Rejected", value: leaveByStatus.rejected, color: "bg-red-400" },
              ].map((s) => {
                const total = leaves.length || 1;
                const pct = Math.round((s.value / total) * 100);
                return (
                  <div key={s.label}>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{s.label}</span>
                      <span>{s.value}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${s.color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {Object.keys(leaveByType).length > 0 && (
              <div className="pt-3 border-t">
                <p className="text-xs font-medium text-gray-500 mb-2">By Type</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(leaveByType).map(([type, count]) => (
                    <span key={type} className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600 capitalize">
                      {type}: {count}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart2 className="h-4 w-4" /> Department Overview</CardTitle></CardHeader>
        <CardContent>
          {departments.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No departments created yet</p>
          ) : (
            <div className="space-y-2">
              {departments.map((d: any) => (
                <div key={d._id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{d.name}</p>
                    {d.head?.name && <p className="text-xs text-gray-400">Head: {d.head.name}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{d.employeeCount || 0} <span className="text-gray-400 font-normal text-xs">employees</span></p>
                    <span className={`text-xs capitalize ${d.status === "active" ? "text-green-600" : "text-gray-400"}`}>{d.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
