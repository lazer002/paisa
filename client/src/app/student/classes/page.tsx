"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, Clock } from "lucide-react";
import API from "@/lib/api";

export default function StudentClassesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["student-classes"],
    queryFn: () => API.classes.getClasses(),
  });
  const classes = (data as any)?.data?.data || (data as any)?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Classes</h1>
        <p className="text-gray-500 text-sm">View your enrolled classes</p>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-400">Loading...</div>
      ) : classes.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Not enrolled in any classes yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((c: any) => (
            <Card key={c._id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{c.name}</CardTitle>
                    <p className="text-sm text-purple-600 mt-0.5 font-medium">{c.subject}</p>
                  </div>
                  <Badge variant={c.status === "active" ? "default" : "secondary"} className="text-xs">{c.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {c.teacherId?.name && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Users className="h-4 w-4 text-gray-400" />
                    Teacher: {c.teacherId.name}
                  </div>
                )}
                {c.room && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Clock className="h-4 w-4 text-gray-400" />
                    Room: {c.room}
                  </div>
                )}
                {c.schedule?.days?.length > 0 && (
                  <p className="text-xs text-gray-500">{c.schedule.days.join(", ")}</p>
                )}
                {c.description && <p className="text-xs text-gray-500 line-clamp-2">{c.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
