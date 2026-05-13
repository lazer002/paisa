"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Clock } from "lucide-react";
import API from "@/lib/api";

export default function EmployeeAnnouncementsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => API.announcements.getAnnouncements(),
  });
  const items = data?.data?.data || data?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Announcements</h1>
        <p className="text-gray-500 text-sm">Company-wide updates and notices</p>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-400">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No announcements</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a: any) => (
            <Card key={a._id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Megaphone className="h-5 w-5 text-slate-500 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-800">{a.title}</h3>
                      <Badge variant={a.priority === "high" ? "destructive" : "outline"} className="text-xs">{a.priority}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{a.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(a.createdAt).toLocaleDateString()}</span>
                      {a.createdBy?.name && <span>by {a.createdBy.name}</span>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
