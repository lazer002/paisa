"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Megaphone, Clock } from "lucide-react";
import API from "@/lib/api";

export default function AnnouncementsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", priority: "medium", targetRoles: ["all"] });

  const { data, isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => API.announcements.getAnnouncements(),
  });
  const items = data?.data?.data || data?.data || [];

  const createMutation = useMutation({
    mutationFn: API.announcements.createAnnouncement,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["announcements"] }); setOpen(false); setForm({ title: "", content: "", priority: "medium", targetRoles: ["all"] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: API.announcements.deleteAnnouncement,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });

  const priorityColors: Record<string, string> = {
    high: "bg-red-100 text-red-700 border-red-200",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    low: "bg-green-100 text-green-700 border-green-200",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Announcements</h1>
          <p className="text-gray-500 text-sm">Broadcast messages to your institute</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New Announcement
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-400">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a: any) => (
            <Card key={a._id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-800">{a.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${priorityColors[a.priority] || priorityColors.medium}`}>
                        {a.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{a.content}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(a.createdAt).toLocaleDateString()}
                      </span>
                      {a.createdBy?.name && <span>by {a.createdBy.name}</span>}
                      {a.targetRoles?.length > 0 && (
                        <span>→ {a.targetRoles.join(", ")}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="icon" variant="ghost" className="h-8 w-8 text-red-500 shrink-0"
                    onClick={() => { if (confirm("Delete this announcement?")) deleteMutation.mutate(a._id); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create Announcement</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <textarea
              className="w-full border rounded-md p-3 text-sm resize-none h-28 focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Announcement content..."
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
            />
            <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
              <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Publishing..." : "Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
