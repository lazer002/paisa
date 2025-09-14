"use client";
// client/src/app/dashboard/students/page.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

type Student = {
    id: number;
    name: string;
    email: string;
    status: "active" | "inactive";
};

const mockStudents: Student[] = [
    { id: 1, name: "Alice Johnson", email: "alice@example.com", status: "active" },
    { id: 2, name: "Bob Smith", email: "bob@example.com", status: "inactive" },
    { id: 3, name: "Charlie Brown", email: "charlie@example.com", status: "active" },
    // ...more mock data
];

export default function StudentsPage() {
    const [students, setStudents] = useState<Student[]>(mockStudents);
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<Student | null>(null);
    const [page, setPage] = useState(1);
    const pageSize = 5;

    const filtered = students.filter(
        (s) =>
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.email.toLowerCase().includes(search.toLowerCase())
    );

    const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

    const handleEdit = (student: Student) => {
        setSelected(student);
        setOpen(true);
    };

    const handleDelete = (id: number) => {
        setStudents((prev) => prev.filter((s) => s.id !== id));
    };

    const handleSave = () => {
        if (selected) {
            setStudents((prev) =>
                prev.map((s) => (s.id === selected.id ? selected : s))
            );
            setOpen(false);
            setSelected(null);
        }
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Students</h1>
                <Button onClick={() => { setSelected({ id: Date.now(), name: "", email: "", status: "active" }); setOpen(true); }}>
                    Add Student
                </Button>
            </div>
            <div className="flex gap-4">
                <Input
                    placeholder="Search students..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paginated.map((student) => (
                        <TableRow key={student.id}>
                            <TableCell>{student.name}</TableCell>
                            <TableCell>{student.email}</TableCell>
                            <TableCell>
                                <Badge variant={student.status === "active" ? "default" : "secondary"}>
                                    {student.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => handleEdit(student)}>
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDelete(student.id)}>
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <Pagination
                page={page}
                pageSize={pageSize}
                total={filtered.length}
                onPageChange={setPage}
            />
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selected?.id && students.find(s => s.id === selected.id) ? "Edit Student" : "Add Student"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Input
                            placeholder="Name"
                            value={selected?.name || ""}
                            onChange={(e) => setSelected((s) => s ? { ...s, name: e.target.value } : s)}
                        />
                        <Input
                            placeholder="Email"
                            value={selected?.email || ""}
                            onChange={(e) => setSelected((s) => s ? { ...s, email: e.target.value } : s)}
                        />
                        <select
                            className="w-full border rounded px-3 py-2"
                            value={selected?.status || "active"}
                            onChange={(e) => setSelected((s) => s ? { ...s, status: e.target.value as "active" | "inactive" } : s)}
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}