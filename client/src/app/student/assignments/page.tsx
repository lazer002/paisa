"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { PenSquare, Clock, CheckCircle } from "lucide-react";
import API from "@/lib/api";

export default function StudentAssignmentsPage() {
  const qc = useQueryClient();
  const [submitOpen, setSubmitOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [content, setContent] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["student-assignments"],
    queryFn: () => API.assignments.getAssignments(),
  });
  const { data: mySubmissions } = useQuery({
    queryKey: ["my-submissions"],
    queryFn: () => API.submissions.getSubmissions(),
  });

  const assignments = data?.data?.data || data?.data || [];
  const submissions = mySubmissions?.data?.data || mySubmissions?.data || [];

  const submissionMap = submissions.reduce((acc: any, s: any) => {
    acc[s.assignmentId?._id || s.assignmentId] = s;
    return acc;
  }, {});

  const submitMutation = useMutation({
    mutationFn: API.submissions.submitAssignment,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-submissions"] }); setSubmitOpen(false); setContent(""); },
  });

  const isOverdue = (dueDate: string) => dueDate && new Date(dueDate) < new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Assignments</h1>
        <p className="text-gray-500 text-sm">View and submit your assignments</p>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-400">Loading...</div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <PenSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No assignments available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a: any) => {
            const mySub = submissionMap[a._id];
            const overdue = isOverdue(a.dueDate);
            return (
              <Card key={a._id} className={overdue && !mySub ? "border-red-200" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-800">{a.title}</h3>
                        {mySub ? (
                          <Badge variant={mySub.status === "graded" ? "default" : "outline"} className="text-xs">
                            {mySub.status === "graded" ? `${mySub.score}/${a.maxScore}` : mySub.status}
                          </Badge>
                        ) : overdue ? (
                          <Badge variant="destructive" className="text-xs">Overdue</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Pending</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-1">{a.classId?.name || "—"} · Max: {a.maxScore} pts</p>
                      {a.description && <p className="text-sm text-gray-600 line-clamp-2">{a.description}</p>}
                      {a.dueDate && (
                        <p className={`text-xs mt-1 flex items-center gap-1 ${overdue ? "text-red-500" : "text-gray-500"}`}>
                          <Clock className="h-3 w-3" /> Due {new Date(a.dueDate).toLocaleDateString()}
                        </p>
                      )}
                      {mySub?.feedback && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                          <strong>Feedback:</strong> {mySub.feedback}
                        </div>
                      )}
                    </div>
                    {!mySub && (
                      <Button size="sm" variant="outline" className="shrink-0 gap-1 text-xs"
                        onClick={() => { setSelected(a); setContent(""); setSubmitOpen(true); }}>
                        <CheckCircle className="h-3 w-3" /> Submit
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Submit Assignment — {selected?.title}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">{selected?.description}</p>
            <textarea
              className="w-full border rounded-md p-3 text-sm resize-none h-32 focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Your answer / submission..."
              value={content}
              onChange={e => setContent(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitOpen(false)}>Cancel</Button>
            <Button onClick={() => submitMutation.mutate({ assignmentId: selected._id, content })} disabled={submitMutation.isPending}>
              {submitMutation.isPending ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
