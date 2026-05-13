"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, Trash2, ExternalLink, FileText, Video, Link2 } from "lucide-react";
import API from "@/lib/api";

const typeIcons: Record<string, any> = {
  pdf: FileText, video: Video, document: FileText,
  link: Link2, image: BookOpen, other: BookOpen,
};

const typeColors: Record<string, string> = {
  pdf: "bg-red-100 text-red-700",
  video: "bg-purple-100 text-purple-700",
  document: "bg-blue-100 text-blue-700",
  link: "bg-green-100 text-green-700",
  image: "bg-yellow-100 text-yellow-700",
  other: "bg-gray-100 text-gray-700",
};

export default function AdminMaterialsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", subject: "", type: "pdf", url: "", classId: "" });

  const { data: materialsData, isLoading } = useQuery({
    queryKey: ["admin-materials"],
    queryFn: () => API.studyMaterials.getMaterials({}),
  });

  const { data: classesData } = useQuery({
    queryKey: ["admin-classes-mat"],
    queryFn: () => API.classes.getClasses(),
  });

  const materials = (materialsData as any)?.data?.data || (materialsData as any)?.data || [];
  const classes = (classesData as any)?.data?.data || (classesData as any)?.data || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => API.studyMaterials.createMaterial(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-materials"] }); setOpen(false); setForm({ title: "", description: "", subject: "", type: "pdf", url: "", classId: "" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => API.studyMaterials.deleteMaterial(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-materials"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Study Materials</h1>
          <p className="text-gray-500 text-sm">Manage learning resources for your institute</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Add Material</Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-400">Loading...</div>
      ) : materials.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No study materials yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map((m: any) => {
            const Icon = typeIcons[m.type] || BookOpen;
            return (
              <Card key={m._id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                      <CardTitle className="text-sm leading-snug">{m.title}</CardTitle>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize flex-shrink-0 ${typeColors[m.type] || typeColors.other}`}>{m.type}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {m.subject && <p className="text-xs text-purple-600 font-medium">{m.subject}</p>}
                  {m.classId?.name && <p className="text-xs text-gray-500">Class: {m.classId.name}</p>}
                  {m.description && <p className="text-xs text-gray-400 line-clamp-2">{m.description}</p>}
                  {m.uploadedBy?.name && <p className="text-xs text-gray-400">By: {m.uploadedBy.name}</p>}
                  <div className="flex items-center justify-between pt-1">
                    <a href={m.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                      <ExternalLink className="h-3 w-3" /> Open
                    </a>
                    <button onClick={() => deleteMutation.mutate(m._id)} className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Study Material</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <Input placeholder="Subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
            <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["pdf", "video", "document", "link", "image", "other"].map(t => (
                  <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={form.classId} onValueChange={v => setForm({ ...form, classId: v })}>
              <SelectTrigger><SelectValue placeholder="Select Class (optional)" /></SelectTrigger>
              <SelectContent>
                {classes.map((c: any) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="URL / Link" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
            <Input placeholder="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate(form)}
              disabled={!form.title || !form.url || createMutation.isPending}
            >
              {createMutation.isPending ? "Adding..." : "Add Material"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
