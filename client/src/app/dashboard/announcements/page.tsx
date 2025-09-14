"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

// Dummy API fetch function
const fetchAnnouncements = async () => {
  return new Promise<
    { id: number; title: string; content: string; date: string; author: string }[]
  >((resolve) =>
    setTimeout(
      () =>
        resolve([
          {
            id: 1,
            title: "Welcome to the Dashboard!",
            content: "Stay tuned for important updates and announcements.",
            date: "2024-06-10",
            author: "Admin",
          },
          {
            id: 2,
            title: "System Maintenance",
            content:
              "Scheduled maintenance on June 15th, 2:00 AM - 4:00 AM UTC. Please save your work and logout before this time to avoid disruptions.",
            date: "2024-06-09",
            author: "IT Team",
          },
        ]),
      800
    )
  );
};

type Announcement = {
  id: number;
  title: string;
  content: string;
  date: string;
  author: string;
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchAnnouncements().then((data) => {
      setAnnouncements(data);
      setLoading(false);
    });
  }, []);

  const filtered = announcements.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase()) ||
      a.author.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className=" mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Announcements</h1>

      <div className="relative">
        <Input
          placeholder="Search announcements..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-muted-foreground py-10">No announcements found.</div>
      ) : (
        <div className="space-y-4">
          {filtered.map((a) => (
            <Card key={a.id} className="border hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{a.title}</CardTitle>
                  <Badge variant="outline">{a.author}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-2">
                  {new Date(a.date).toLocaleDateString()}
                </div>
                <Collapsible>
                  <CollapsibleTrigger className="text-sm text-blue-600 hover:underline">
                    Read more
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 text-sm text-foreground">
                    {a.content}
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
