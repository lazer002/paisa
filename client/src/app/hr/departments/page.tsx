"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Building2, Trash2, Pencil } from "lucide-react";
import API from "@/lib/api";

export default function HRDepartmentsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", code: "", description: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: () => API.departments.getDepartments(),
  });
  const departments = data?.data?.data || data?.data || [];

  const createMutation = useMutation({
    mutationFn: API.departments.createDepartment,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["departments"] }); setOpen(false); setForm({ name: "", code: "", description: "" }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => API.departments.updateDepartment(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["departments"] }); setEditOpen(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: API.departments.deleteDepartment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["departments"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Departments</h1>
          <p className="text-gray-500 text-sm">Organize your workforce into departments</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Department
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-400">Loading...</div>
      ) : departments.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No departments yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((d: any) => (
            <Card key={d._id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-800">{d.name}</h3>
                    {d.code && <p className="text-xs text-gray-400">Code: {d.code}</p>}
                  </div>
                  <Badge variant={d.status === "active" ? "default" : "secondary"} className="text-xs">{d.status}</Badge>
                </div>
                {d.description && <p className="text-sm text-gray-600 mb-2 line-clamp-2">{d.description}</p>}
                {d.head?.name && (
                  <p className="text-xs text-gray-500">Head: {d.head.name}</p>
                )}
                <div className="flex gap-2 mt-3">
                  <Button size="icon" variant="ghost" className="h-8 w-8"
                    onClick={() => { setEditing({ ...d }); setEditOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500"
                    onClick={() => { if (confirm("Delete department?")) deleteMutation.mutate(d._id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Department</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Department Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Code (e.g. ENG)" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
            <textarea className="w-full border rounded-md p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {editing && (
        <Dialog open={editOpen} onOpenChange={v => { setEditOpen(v); if (!v) setEditing(null); }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Department</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
              <Input value={editing.code || ""} onChange={e => setEditing({ ...editing, code: e.target.value })} placeholder="Code" />
              <textarea className="w-full border rounded-md p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-ring"
                value={editing.description || ""} onChange={e => setEditing({ ...editing, description: e.target.value })} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button onClick={() => updateMutation.mutate({ id: editing._id, data: editing })} disabled={updateMutation.isPending}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
