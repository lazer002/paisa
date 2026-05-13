"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Search, Users } from "lucide-react";
import API from "@/lib/api";

export default function AdminClassesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", subject: "", teacherId: "", room: "", maxStudents: "50", description: "" });

  const { data, isLoading } = useQuery({ queryKey: ["admin-classes"], queryFn: () => API.classes.getClasses() });
  const { data: usersData } = useQuery({ queryKey: ["admin-users"], queryFn: () => API.users.getUsers() });

  const classes = (data as any)?.data?.data || (data as any)?.data || [];
  const users = (usersData as any)?.data || usersData || [];
  const teachers = users.filter((u: any) => u.role === "teacher");

  const createMutation = useMutation({
    mutationFn: API.classes.createClass,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-classes"] }); setOpen(false); setForm({ name: "", subject: "", teacherId: "", room: "", maxStudents: "50", description: "" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: API.classes.deleteClass,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-classes"] }),
  });

  const filtered = classes.filter((c: any) =>
    [c.name, c.subject, c.teacherId?.name].join(" ").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Classes</h1>
          <p className="text-gray-500 text-sm">Manage institute classes and subjects</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Class
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input className="pl-9" placeholder="Search classes..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Name</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-400">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-400">No classes found</TableCell></TableRow>
            ) : filtered.map((c: any) => (
              <TableRow key={c._id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-gray-600">{c.subject}</TableCell>
                <TableCell className="text-gray-600">{c.teacherId?.name || "—"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{c.studentIds?.length || 0}/{c.maxStudents}</span>
                  </div>
                </TableCell>
                <TableCell className="text-gray-600">{c.room || "—"}</TableCell>
                <TableCell>
                  <Badge variant={c.status === "active" ? "default" : "secondary"} className="text-xs capitalize">{c.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500"
                    onClick={() => { if (confirm("Delete class?")) deleteMutation.mutate(c._id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Class</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Class Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
            <Select value={form.teacherId} onValueChange={v => setForm({ ...form, teacherId: v })}>
              <SelectTrigger><SelectValue placeholder="Assign Teacher" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">No teacher assigned</SelectItem>
                {teachers.map((t: any) => <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Room" value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} />
              <Input type="number" placeholder="Max Students" value={form.maxStudents} onChange={e => setForm({ ...form, maxStudents: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate({ ...form, teacherId: form.teacherId || undefined, maxStudents: Number(form.maxStudents) })} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
