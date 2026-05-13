"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import API from "@/lib/api";

export default function HRLeavesPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["hr-leaves", statusFilter],
    queryFn: () => API.leaves.getLeaves(statusFilter !== "all" ? { status: statusFilter } : undefined),
  });
  const leaves = data?.data?.data || data?.data || [];

  const updateMutation = useMutation({
    mutationFn: ({ id, status, reason }: any) => API.leaves.updateStatus(id, status, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr-leaves"] }); setRejectOpen(false); },
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
          <h1 className="text-2xl font-bold">Leave Requests</h1>
          <p className="text-gray-500 text-sm">Review and manage employee leaves</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-400">Loading...</div>
      ) : leaves.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No leave requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaves.map((l: any) => (
            <Card key={l._id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-800">{l.userId?.name || "—"}</h3>
                      <span className="text-xs text-gray-400">{l.userId?.userCode}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${statusColors[l.status] || ""}`}>{l.status}</span>
                    </div>
                    <p className="text-sm text-gray-600 capitalize mb-1">{l.type} Leave · {l.days} day(s)</p>
                    <p className="text-xs text-gray-500">
                      {new Date(l.startDate).toLocaleDateString()} — {new Date(l.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">{l.reason}</p>
                    {l.rejectionReason && (
                      <p className="text-xs text-red-600 mt-1">Rejection: {l.rejectionReason}</p>
                    )}
                  </div>
                  {l.status === "pending" && (
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700 text-xs"
                        onClick={() => updateMutation.mutate({ id: l._id, status: "approved" })}>
                        <CheckCircle className="h-3 w-3" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1 text-red-600 border-red-200 hover:bg-red-50 text-xs"
                        onClick={() => { setRejectingId(l._id); setRejectReason(""); setRejectOpen(true); }}>
                        <XCircle className="h-3 w-3" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Leave Request</DialogTitle></DialogHeader>
          <Input placeholder="Reason for rejection..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => updateMutation.mutate({ id: rejectingId, status: "rejected", reason: rejectReason })}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
