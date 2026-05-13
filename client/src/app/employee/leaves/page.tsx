"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Calendar, XCircle } from "lucide-react";
import API from "@/lib/api";

export default function EmployeeLeavesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: "casual", startDate: "", endDate: "", reason: "" });

  const { data, isLoading } = useQuery({ queryKey: ["my-leaves"], queryFn: () => API.leaves.getLeaves() });
  const leaves = data?.data?.data || data?.data || [];

  const applyMutation = useMutation({
    mutationFn: API.leaves.applyLeave,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-leaves"] }); setOpen(false); setForm({ type: "casual", startDate: "", endDate: "", reason: "" }); },
  });

  const cancelMutation = useMutation({
    mutationFn: API.leaves.cancelLeave,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-leaves"] }),
  });

  const statusColors: Record<string, string> = {
    pending: "text-orange-600 border-orange-200 bg-orange-50",
    approved: "text-green-600 border-green-200 bg-green-50",
    rejected: "text-red-600 border-red-200 bg-red-50",
    cancelled: "text-gray-600 border-gray-200 bg-gray-50",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Leave Requests</h1>
          <p className="text-gray-500 text-sm">Apply and track your leaves</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Apply Leave
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-400">Loading...</div>
      ) : leaves.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No leave requests yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaves.map((l: any) => (
            <Card key={l._id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold capitalize">{l.type} Leave</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${statusColors[l.status] || ""}`}>{l.status}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">
                      {new Date(l.startDate).toLocaleDateString()} — {new Date(l.endDate).toLocaleDateString()} ({l.days} day(s))
                    </p>
                    <p className="text-sm text-gray-700">{l.reason}</p>
                    {l.rejectionReason && (
                      <p className="text-xs text-red-600 mt-1">Reason: {l.rejectionReason}</p>
                    )}
                  </div>
                  {l.status === "pending" && (
                    <Button size="sm" variant="outline" className="shrink-0 gap-1 text-xs text-red-600 border-red-200"
                      onClick={() => { if (confirm("Cancel this leave?")) cancelMutation.mutate(l._id); }}>
                      <XCircle className="h-3 w-3" /> Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Apply for Leave</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sick">Sick Leave</SelectItem>
                <SelectItem value="casual">Casual Leave</SelectItem>
                <SelectItem value="earned">Earned Leave</SelectItem>
                <SelectItem value="maternity">Maternity Leave</SelectItem>
                <SelectItem value="paternity">Paternity Leave</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
                <Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">End Date</label>
                <Input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <textarea className="w-full border rounded-md p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Reason for leave..." value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => applyMutation.mutate(form)} disabled={applyMutation.isPending}>
              {applyMutation.isPending ? "Applying..." : "Apply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
