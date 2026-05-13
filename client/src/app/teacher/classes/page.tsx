"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Clock, Plus } from "lucide-react";
import API from "@/lib/api";

export default function TeacherClassesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [studentsOpen, setStudentsOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [form, setForm] = useState({ name: "", subject: "", description: "", room: "", maxStudents: "50" });

  const { data, isLoading } = useQuery({
    queryKey: ["teacher-classes"],
    queryFn: () => API.classes.getClasses(),
  });
  const classes = data?.data?.data || data?.data || [];

  const createMutation = useMutation({
    mutationFn: API.classes.createClass,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["teacher-classes"] }); setOpen(false); setForm({ name: "", subject: "", description: "", room: "", maxStudents: "50" }); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Classes</h1>
          <p className="text-gray-500 text-sm">Manage your classes and students</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Class
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-400">Loading...</div>
      ) : classes.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No classes yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((c: any) => (
            <Card key={c._id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{c.name}</CardTitle>
                    <p className="text-sm text-gray-500 mt-0.5">{c.subject}</p>
                  </div>
                  <Badge variant={c.status === "active" ? "default" : "secondary"} className="text-xs">{c.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {c.room && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Clock className="h-4 w-4 text-gray-400" />
                    Room: {c.room}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Users className="h-4 w-4 text-gray-400" />
                  {c.studentIds?.length || 0} / {c.maxStudents} students
                </div>
                {c.description && <p className="text-xs text-gray-500 line-clamp-2">{c.description}</p>}
                <Button size="sm" variant="outline" className="w-full text-xs"
                  onClick={() => { setSelectedClass(c); setStudentsOpen(true); }}>
                  View Students
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Class</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Class Name (e.g. Math 101)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
            <Input placeholder="Room (optional)" value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} />
            <Input type="number" placeholder="Max Students" value={form.maxStudents} onChange={e => setForm({ ...form, maxStudents: e.target.value })} />
            <textarea className="w-full border rounded-md p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate({ ...form, maxStudents: Number(form.maxStudents) })} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Class"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Students Dialog */}
      <Dialog open={studentsOpen} onOpenChange={setStudentsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Students — {selectedClass?.name}</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {(selectedClass?.studentIds || []).length === 0 ? (
              <p className="text-center text-gray-400 py-4">No students enrolled</p>
            ) : selectedClass?.studentIds?.map((s: any) => (
              <div key={s._id || s} className="flex items-center justify-between p-2 rounded border">
                <div>
                  <p className="font-medium text-sm">{s.name || "Unknown"}</p>
                  <p className="text-xs text-gray-500">{s.email || s}</p>
                </div>
                <span className="text-xs text-gray-400">{s.userCode || ""}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
