"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, FileText, Trash2, ExternalLink } from "lucide-react";
import API from "@/lib/api";

const typeColors: Record<string, string> = {
  pdf: "bg-red-100 text-red-700",
  video: "bg-purple-100 text-purple-700",
  document: "bg-blue-100 text-blue-700",
  link: "bg-green-100 text-green-700",
  image: "bg-yellow-100 text-yellow-700",
  other: "bg-gray-100 text-gray-700",
};

export default function TeacherMaterialsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", subject: "", type: "document", url: "", classId: "" });

  const { data, isLoading } = useQuery({ queryKey: ["teacher-materials"], queryFn: () => API.studyMaterials.getMaterials() });
  const { data: classData } = useQuery({ queryKey: ["teacher-classes"], queryFn: () => API.classes.getClasses() });

  const materials = data?.data?.data || data?.data || [];
  const classes = classData?.data?.data || classData?.data || [];

  const createMutation = useMutation({
    mutationFn: API.studyMaterials.createMaterial,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["teacher-materials"] }); setOpen(false); setForm({ title: "", description: "", subject: "", type: "document", url: "", classId: "" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: API.studyMaterials.deleteMaterial,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teacher-materials"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Study Materials</h1>
          <p className="text-gray-500 text-sm">Upload and manage learning resources</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Upload Material
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-400">Loading...</div>
      ) : materials.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No materials uploaded yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map((m: any) => (
            <Card key={m._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${typeColors[m.type] || typeColors.other}`}>{m.type}</span>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 -mt-1 -mr-1"
                    onClick={() => { if (confirm("Delete material?")) deleteMutation.mutate(m._id); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">{m.title}</h3>
                {m.subject && <p className="text-xs text-gray-500">{m.subject}</p>}
                {m.classId?.name && <p className="text-xs text-gray-400">{m.classId.name}</p>}
                {m.description && <p className="text-sm text-gray-600 line-clamp-2 mt-1">{m.description}</p>}
                {m.url && (
                  <a href={m.url} target="_blank" rel="noopener noreferrer"
                    className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:underline">
                    <ExternalLink className="h-3 w-3" /> Open
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Study Material</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <Input placeholder="Subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
            <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="document">Document</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="link">Link</SelectItem>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={form.classId} onValueChange={v => setForm({ ...form, classId: v })}>
              <SelectTrigger><SelectValue placeholder="Select Class (optional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">No specific class</SelectItem>
                {classes.map((c: any) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="URL / Link" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
            <textarea className="w-full border rounded-md p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate({ ...form, classId: form.classId || undefined })} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
