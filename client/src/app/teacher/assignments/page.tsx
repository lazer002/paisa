"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, PenSquare, Clock, Users } from "lucide-react";
import API from "@/lib/api";

export default function TeacherAssignmentsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [submissionsOpen, setSubmissionsOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [gradeOpen, setGradeOpen] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState<any>(null);
  const [gradeForm, setGradeForm] = useState({ score: "", feedback: "" });
  const [form, setForm] = useState({
    title: "", description: "", classId: "", dueDate: "", maxScore: "100", instructions: "",
  });

  const { data } = useQuery({ queryKey: ["teacher-assignments"], queryFn: () => API.assignments.getAssignments() });
  const { data: classesData } = useQuery({ queryKey: ["teacher-classes"], queryFn: () => API.classes.getClasses() });
  const { data: submissionsData } = useQuery({
    queryKey: ["submissions", selectedAssignment?._id],
    queryFn: () => API.submissions.getSubmissions({ assignmentId: selectedAssignment?._id }),
    enabled: !!selectedAssignment,
  });

  const assignments = data?.data?.data || data?.data || [];
  const classes = classesData?.data?.data || classesData?.data || [];
  const submissions = submissionsData?.data?.data || submissionsData?.data || [];

  const createMutation = useMutation({
    mutationFn: API.assignments.createAssignment,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["teacher-assignments"] }); setOpen(false); setForm({ title: "", description: "", classId: "", dueDate: "", maxScore: "100", instructions: "" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: API.assignments.deleteAssignment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teacher-assignments"] }),
  });

  const gradeMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => API.submissions.gradeSubmission(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["submissions", selectedAssignment?._id] }); setGradeOpen(false); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Assignments</h1>
          <p className="text-gray-500 text-sm">Create and manage assignments</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New Assignment
        </Button>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <PenSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No assignments yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a: any) => (
            <Card key={a._id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-800">{a.title}</h3>
                      <Badge variant={a.status === "published" ? "default" : "outline"} className="text-xs">{a.status}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">{a.classId?.name || "—"} · Max: {a.maxScore} pts</p>
                    {a.dueDate && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Due {new Date(a.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="outline" className="gap-1 text-xs"
                      onClick={() => { setSelectedAssignment(a); setSubmissionsOpen(true); }}>
                      <Users className="h-3 w-3" /> Submissions
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500"
                      onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(a._id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create Assignment</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Assignment Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <Select value={form.classId} onValueChange={v => setForm({ ...form, classId: v })}>
              <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
              <SelectContent>
                {classes.map((c: any) => <SelectItem key={c._id} value={c._id}>{c.name} — {c.subject}</SelectItem>)}
              </SelectContent>
            </Select>
            <textarea className="w-full border rounded-md p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Description..."
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Due Date</label>
                <Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Max Score</label>
                <Input type="number" value={form.maxScore} onChange={e => setForm({ ...form, maxScore: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate({ ...form, maxScore: Number(form.maxScore) })} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submissions Dialog */}
      <Dialog open={submissionsOpen} onOpenChange={setSubmissionsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Submissions — {selectedAssignment?.title}</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {submissions.length === 0 ? (
              <p className="text-center text-gray-400 py-4">No submissions yet</p>
            ) : submissions.map((s: any) => (
              <div key={s._id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">{s.studentId?.name}</p>
                  <p className="text-xs text-gray-500">{s.studentId?.userCode} · {s.submittedAt ? new Date(s.submittedAt).toLocaleString() : "Not submitted"}</p>
                </div>
                <div className="flex items-center gap-2">
                  {s.score != null && <span className="text-sm font-semibold">{s.score}/{selectedAssignment?.maxScore}</span>}
                  <Badge variant={s.status === "graded" ? "default" : s.status === "submitted" ? "outline" : "secondary"} className="text-xs">{s.status}</Badge>
                  {s.status === "submitted" && (
                    <Button size="sm" variant="outline" className="text-xs"
                      onClick={() => { setGradingSubmission(s); setGradeForm({ score: "", feedback: "" }); setGradeOpen(true); }}>
                      Grade
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Grade Dialog */}
      <Dialog open={gradeOpen} onOpenChange={setGradeOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Grade Submission — {gradingSubmission?.studentId?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input type="number" placeholder={`Score (max ${selectedAssignment?.maxScore})`} value={gradeForm.score}
              onChange={e => setGradeForm({ ...gradeForm, score: e.target.value })} />
            <textarea className="w-full border rounded-md p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Feedback..." value={gradeForm.feedback} onChange={e => setGradeForm({ ...gradeForm, feedback: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGradeOpen(false)}>Cancel</Button>
            <Button onClick={() => gradeMutation.mutate({ id: gradingSubmission._id, score: Number(gradeForm.score), feedback: gradeForm.feedback })}
              disabled={gradeMutation.isPending}>
              {gradeMutation.isPending ? "Saving..." : "Submit Grade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
