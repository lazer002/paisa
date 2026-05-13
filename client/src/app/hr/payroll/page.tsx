"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import API from "@/lib/api";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function HRPayrollPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    employeeId: "", month: String(new Date().getMonth() + 1), year: String(new Date().getFullYear()),
    basicSalary: "", hra: "0", transport: "0", medical: "0", pf: "0", tax: "0", remarks: "",
  });

  const { data, isLoading } = useQuery({ queryKey: ["payrolls"], queryFn: () => API.payroll.getPayrolls() });
  const { data: empData } = useQuery({ queryKey: ["employees"], queryFn: () => API.users.getUsers() });

  const payrolls = data?.data?.data || data?.data || [];
  const employees = (empData?.data?.data || empData?.data || []).filter((u: any) => u.role === "employee");

  const createMutation = useMutation({
    mutationFn: API.payroll.createPayroll,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payrolls"] }); setOpen(false); },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: any) => API.payroll.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payrolls"] }),
  });

  const calcNet = () => {
    const basic = Number(form.basicSalary) || 0;
    const allow = (Number(form.hra) + Number(form.transport) + Number(form.medical));
    const deduct = (Number(form.pf) + Number(form.tax));
    return basic + allow - deduct;
  };

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    processed: "bg-blue-100 text-blue-700",
    paid: "bg-green-100 text-green-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payroll</h1>
          <p className="text-gray-500 text-sm">Process and manage employee payrolls</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Process Payroll
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Employee</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Basic</TableHead>
              <TableHead>Net Salary</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">Loading...</TableCell></TableRow>
            ) : payrolls.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">No payroll records</TableCell></TableRow>
            ) : payrolls.map((p: any) => (
              <TableRow key={p._id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{p.employeeId?.name || "—"}</p>
                    <p className="text-xs text-gray-400">{p.employeeId?.userCode}</p>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{MONTHS[p.month - 1]} {p.year}</TableCell>
                <TableCell className="text-sm">₹{p.basicSalary?.toLocaleString()}</TableCell>
                <TableCell className="text-sm font-semibold">₹{p.netSalary?.toLocaleString()}</TableCell>
                <TableCell>
                  <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${statusColors[p.status] || ""}`}>{p.status}</span>
                </TableCell>
                <TableCell className="text-right">
                  {p.status === "processed" && (
                    <Button size="sm" variant="outline" className="text-xs"
                      onClick={() => updateStatusMutation.mutate({ id: p._id, status: "paid" })}>
                      Mark Paid
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Process Payroll</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Select value={form.employeeId} onValueChange={v => setForm({ ...form, employeeId: v })}>
              <SelectTrigger><SelectValue placeholder="Select Employee" /></SelectTrigger>
              <SelectContent>
                {employees.map((e: any) => <SelectItem key={e._id} value={e._id}>{e.name} ({e.userCode})</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Select value={form.month} onValueChange={v => setForm({ ...form, month: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="Year" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} />
            </div>
            <Input type="number" placeholder="Basic Salary" value={form.basicSalary} onChange={e => setForm({ ...form, basicSalary: e.target.value })} />
            <div className="grid grid-cols-3 gap-2">
              <Input type="number" placeholder="HRA" value={form.hra} onChange={e => setForm({ ...form, hra: e.target.value })} />
              <Input type="number" placeholder="Transport" value={form.transport} onChange={e => setForm({ ...form, transport: e.target.value })} />
              <Input type="number" placeholder="Medical" value={form.medical} onChange={e => setForm({ ...form, medical: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="PF Deduction" value={form.pf} onChange={e => setForm({ ...form, pf: e.target.value })} />
              <Input type="number" placeholder="Tax Deduction" value={form.tax} onChange={e => setForm({ ...form, tax: e.target.value })} />
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              <span className="text-gray-500">Net Salary: </span>
              <span className="font-bold text-lg">₹{calcNet().toLocaleString()}</span>
            </div>
            <Input placeholder="Remarks (optional)" value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate({
              employeeId: form.employeeId, month: Number(form.month), year: Number(form.year),
              basicSalary: Number(form.basicSalary), remarks: form.remarks,
              allowances: { hra: Number(form.hra), transport: Number(form.transport), medical: Number(form.medical) },
              deductions: { pf: Number(form.pf), tax: Number(form.tax) },
            })} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Processing..." : "Process"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
