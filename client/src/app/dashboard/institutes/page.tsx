"use client";
// client/src/app/dashboard/institutes/page.tsx
import React, { use, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

type Institute = {
    id: number;
    name: string;
    location: string;
    status: "Active" | "Inactive";
};

const initialInstitutes: Institute[] = [
    { id: 1, name: "Harvard University", location: "Cambridge, MA", status: "Active" },
    { id: 2, name: "Stanford University", location: "Stanford, CA", status: "Active" },
    { id: 3, name: "MIT", location: "Cambridge, MA", status: "Inactive" },
];

export default function InstitutesPage() {
    const [institutes, setInstitutes] = useState<Institute[]>(initialInstitutes);
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [newInstitute, setNewInstitute] = useState({ name: "", location: "", status: "Active" as "Active" | "Inactive" });

    const filteredInstitutes = institutes.filter(
        (i) =>
            i.name.toLowerCase().includes(search.toLowerCase()) ||
            i.location.toLowerCase().includes(search.toLowerCase())
    );

    const handleAddInstitute = () => {
        setInstitutes([
            ...institutes,
            {
                id: institutes.length + 1,
                ...newInstitute,
            },
        ]);
        setNewInstitute({ name: "", location: "", status: "Active" });
        setOpen(false);
    };

    const handleDelete = (id: number) => {
        setInstitutes(institutes.filter((i) => i.id !== id));
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Institutes</h1>
                <Button onClick={() => setOpen(true)}>Add Institute</Button>
            </div>
            <div className="mb-4 flex gap-2">
                <Input
                    placeholder="Search institutes..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredInstitutes.map((institute) => (
                        <TableRow key={institute.id}>
                            <TableCell>{institute.name}</TableCell>
                            <TableCell>{institute.location}</TableCell>
                            <TableCell>
                                <Badge variant={institute.status === "Active" ? "default" : "secondary"}>
                                    {institute.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>Edit</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDelete(institute.id)} className="text-red-600">
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
                        <DialogTitle>Add Institute</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Name</Label>
                            <Input
                                value={newInstitute.name}
                                onChange={(e) => setNewInstitute({ ...newInstitute, name: e.target.value })}
                                placeholder="Institute Name"
                            />
                        </div>
                        <div>
                            <Label>Location</Label>
                            <Input
                                value={newInstitute.location}
                                onChange={(e) => setNewInstitute({ ...newInstitute, location: e.target.value })}
                                placeholder="Location"
                            />
                        </div>
                        <div>
                            <Label>Status</Label>
                            <select
                                className="w-full border rounded px-2 py-1"
                                value={newInstitute.status}
                                onChange={(e) =>
                                    setNewInstitute({ ...newInstitute, status: e.target.value as "Active" | "Inactive" })
                                }
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddInstitute} disabled={!newInstitute.name || !newInstitute.location}>
                            Add
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
