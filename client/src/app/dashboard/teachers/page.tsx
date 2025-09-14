"use client";
// client/src/app/dashboard/teachers/page.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

type Teacher = {
    id: number;
    name: string;
    email: string;
    subject: string;
    status: "Active" | "Inactive";
};

const initialTeachers: Teacher[] = [
    { id: 1, name: "Alice Smith", email: "alice@school.edu", subject: "Math", status: "Active" },
    { id: 2, name: "Bob Johnson", email: "bob@school.edu", subject: "Science", status: "Inactive" },
    { id: 3, name: "Carol Lee", email: "carol@school.edu", subject: "English", status: "Active" },
];

export default function TeachersPage() {
    const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<Omit<Teacher, "id">>({ name: "", email: "", subject: "", status: "Active" });

    const filtered = teachers.filter(
        t =>
            t.name.toLowerCase().includes(search.toLowerCase()) ||
            t.email.toLowerCase().includes(search.toLowerCase()) ||
            t.subject.toLowerCase().includes(search.toLowerCase())
    );

    function handleAddTeacher() {
        setTeachers(prev => [
            ...prev,
            { id: Date.now(), ...form }
        ]);
        setForm({ name: "", email: "", subject: "", status: "Active" });
        setOpen(false);
    }

    function handleDelete(id: number) {
        setTeachers(prev => prev.filter(t => t.id !== id));
    }

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Teachers</h1>
                <Button onClick={() => setOpen(true)}>Add Teacher</Button>
            </div>
            <div className="mb-4 flex gap-2">
                <Input
                    placeholder="Search teachers..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="max-w-xs"
                />
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-10" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filtered.map(teacher => (
                        <TableRow key={teacher.id}>
                            <TableCell>{teacher.name}</TableCell>
                            <TableCell>{teacher.email}</TableCell>
                            <TableCell>{teacher.subject}</TableCell>
                            <TableCell>
                                <Badge variant={teacher.status === "Active" ? "default" : "secondary"}>
                                    {teacher.status}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => handleDelete(teacher.id)}>
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Teacher</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Name</Label>
                            <Input
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            />
                        </div>
                        <div>
                            <Label>Email</Label>
                            <Input
                                value={form.email}
                                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                            />
                        </div>
                        <div>
                            <Label>Subject</Label>
                            <Input
                                value={form.subject}
                                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                            />
                        </div>
                        <div>
                            <Label>Status</Label>
                            <select
                                className="w-full border rounded px-2 py-1"
                                value={form.status}
                                onChange={e => setForm(f => ({ ...f, status: e.target.value as Teacher["status"] }))}
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleAddTeacher}>Add</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}