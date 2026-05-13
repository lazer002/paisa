"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, ExternalLink } from "lucide-react";
import API from "@/lib/api";

const typeColors: Record<string, string> = {
  pdf: "bg-red-100 text-red-700",
  video: "bg-purple-100 text-purple-700",
  document: "bg-blue-100 text-blue-700",
  link: "bg-green-100 text-green-700",
  image: "bg-yellow-100 text-yellow-700",
  other: "bg-gray-100 text-gray-700",
};

export default function StudentMaterialsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["study-materials"],
    queryFn: () => API.studyMaterials.getMaterials(),
  });
  const materials = data?.data?.data || data?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Study Materials</h1>
        <p className="text-gray-500 text-sm">Access your learning resources</p>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-400">Loading...</div>
      ) : materials.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No study materials available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map((m: any) => (
            <Card key={m._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${typeColors[m.type] || typeColors.other}`}>
                    {m.type}
                  </span>
                  {m.classId?.name && (
                    <span className="text-xs text-gray-400">{m.classId.name}</span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">{m.title}</h3>
                {m.subject && <p className="text-xs text-gray-500 mb-1">Subject: {m.subject}</p>}
                {m.description && <p className="text-sm text-gray-600 line-clamp-2 mb-2">{m.description}</p>}
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>by {m.uploadedBy?.name || "—"}</span>
                  <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                </div>
                {m.url && (
                  <a href={m.url} target="_blank" rel="noopener noreferrer"
                    className="mt-3 flex items-center gap-1 text-xs text-blue-600 hover:underline">
                    <ExternalLink className="h-3 w-3" /> Open Resource
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
