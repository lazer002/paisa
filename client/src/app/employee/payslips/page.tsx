"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet } from "lucide-react";
import API from "@/lib/api";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function EmployeePayslipsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-payslips"],
    queryFn: () => API.payroll.getPayrolls(),
  });
  const payslips = data?.data?.data || data?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Payslips</h1>
        <p className="text-gray-500 text-sm">View your salary records</p>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-400">Loading...</div>
      ) : payslips.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Wallet className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No payslips available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payslips.map((p: any) => (
            <Card key={p._id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-800">{MONTHS[p.month - 1]} {p.year}</h3>
                    <div className="mt-2 grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-500">Basic</span>
                        <span>₹{p.basicSalary?.toLocaleString()}</span>
                      </div>
                      {p.allowances?.hra > 0 && (
                        <div className="flex justify-between gap-4">
                          <span className="text-gray-500">HRA</span>
                          <span>₹{p.allowances.hra.toLocaleString()}</span>
                        </div>
                      )}
                      {p.allowances?.transport > 0 && (
                        <div className="flex justify-between gap-4">
                          <span className="text-gray-500">Transport</span>
                          <span>₹{p.allowances.transport.toLocaleString()}</span>
                        </div>
                      )}
                      {p.deductions?.pf > 0 && (
                        <div className="flex justify-between gap-4">
                          <span className="text-gray-500">PF</span>
                          <span className="text-red-500">-₹{p.deductions.pf.toLocaleString()}</span>
                        </div>
                      )}
                      {p.deductions?.tax > 0 && (
                        <div className="flex justify-between gap-4">
                          <span className="text-gray-500">Tax</span>
                          <span className="text-red-500">-₹{p.deductions.tax.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 pt-2 border-t flex justify-between">
                      <span className="font-semibold">Net Salary</span>
                      <span className="font-bold text-lg text-green-700">₹{p.netSalary?.toLocaleString()}</span>
                    </div>
                    {p.remarks && <p className="text-xs text-gray-400 mt-1">{p.remarks}</p>}
                  </div>
                  <Badge
                    variant={p.status === "paid" ? "default" : "outline"}
                    className="shrink-0 capitalize"
                  >
                    {p.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
