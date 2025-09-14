"use client";
// client/src/app/dashboard/study-material/page.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

type Material = {
    id: number;
    title: string;
    description: string;
    tags: string[];
    type: "Document" | "Video" | "Quiz";
    link: string;
};

const mockMaterials: Material[] = [
    {
        id: 1,
        title: "React Basics",
        description: "Introduction to React fundamentals.",
        tags: ["React", "Frontend"],
        type: "Document",
        link: "#",
    },
    {
        id: 2,
        title: "TypeScript Deep Dive",
        description: "Advanced TypeScript concepts.",
        tags: ["TypeScript", "Programming"],
        type: "Video",
        link: "#",
    },
    {
        id: 3,
        title: "JavaScript Quiz",
        description: "Test your JS knowledge.",
        tags: ["JavaScript", "Quiz"],
        type: "Quiz",
        link: "#",
    },
];

export default function StudyMaterialPage() {
    const [search, setSearch] = useState("");
    const [materials, setMaterials] = useState<Material[]>(mockMaterials);

    const filtered = materials.filter(
        (m) =>
            m.title.toLowerCase().includes(search.toLowerCase()) ||
            m.description.toLowerCase().includes(search.toLowerCase()) ||
            m.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="container mx-auto py-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Study Material</h1>
                <Button variant="outline">Upload Material</Button>
            </div>
            <Tabs defaultValue="all" className="mb-4">
                <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="Document">Documents</TabsTrigger>
                    <TabsTrigger value="Video">Videos</TabsTrigger>
                    <TabsTrigger value="Quiz">Quizzes</TabsTrigger>
                </TabsList>
                <TabsContent value="all">
                    <MaterialList materials={filtered} search={search} setSearch={setSearch} />
                </TabsContent>
                <TabsContent value="Document">
                    <MaterialList
                        materials={filtered.filter((m) => m.type === "Document")}
                        search={search}
                        setSearch={setSearch}
                    />
                </TabsContent>
                <TabsContent value="Video">
                    <MaterialList
                        materials={filtered.filter((m) => m.type === "Video")}
                        search={search}
                        setSearch={setSearch}
                    />
                </TabsContent>
                <TabsContent value="Quiz">
                    <MaterialList
                        materials={filtered.filter((m) => m.type === "Quiz")}
                        search={search}
                        setSearch={setSearch}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function MaterialList({
    materials,
    search,
    setSearch,
}: {
    materials: Material[];
    search: string;
    setSearch: (v: string) => void;
}) {
    return (
        <div>
            <Input
                placeholder="Search materials..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mb-4"
            />
            <ScrollArea className="h-[400px]">
                {materials.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">No materials found.</div>
                )}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {materials.map((m) => (
                        <Card key={m.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    {m.title}
                                    <Badge variant="secondary">{m.type}</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="mb-2 text-muted-foreground">{m.description}</p>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {m.tags.map((tag) => (
                                        <Badge key={tag} variant="outline">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                                <Separator className="mb-2" />
                                <Button asChild size="sm" variant="default">
                                    <a href={m.link} target="_blank" rel="noopener noreferrer">
                                        View Material
                                    </a>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}