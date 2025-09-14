"use client";
// client/src/app/dashboard/hr/page.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Employee = {
    id: number;
    name: string;
    position: string;
    status: "Active" | "On Leave" | "Inactive";
    avatarUrl?: string;
};

const initialEmployees: Employee[] = [
    { id: 1, name: "Alice Johnson", position: "Software Engineer", status: "Active", avatarUrl: "" },
    { id: 2, name: "Bob Smith", position: "Product Manager", status: "On Leave", avatarUrl: "" },
    { id: 3, name: "Carol Lee", position: "Designer", status: "Active", avatarUrl: "" },
];

export default function HRDashboardPage() {
    const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);

    const filteredEmployees = employees.filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.position.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>HR Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="employees">
                        <TabsList>
                            <TabsTrigger value="employees">Employees</TabsTrigger>
                            <TabsTrigger value="reports">Reports</TabsTrigger>
                        </TabsList>
                        <TabsContent value="employees">
                            <div className="flex items-center justify-between mb-4">
                                <Input
                                    placeholder="Search employees..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-1/3"
                                />
                                <Dialog open={open} onOpenChange={setOpen}>
                                    <DialogTrigger asChild>
                                        <Button>Add Employee</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Add New Employee</DialogTitle>
                                        </DialogHeader>
                                        {/* Add employee form here */}
                                        <div className="space-y-2">
                                            <Input placeholder="Name" />
                                            <Input placeholder="Position" />
                                            <Button>Add</Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Avatar</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Position</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredEmployees.map(emp => (
                                        <TableRow key={emp.id}>
                                            <TableCell>
                                                <Avatar>
                                                    <AvatarImage src={emp.avatarUrl} />
                                                    <AvatarFallback>{emp.name[0]}</AvatarFallback>
                                                </Avatar>
                                            </TableCell>
                                            <TableCell>{emp.name}</TableCell>
                                            <TableCell>{emp.position}</TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    emp.status === "Active" ? "default" :
                                                    emp.status === "On Leave" ? "secondary" : "destructive"
                                                }>
                                                    {emp.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TabsContent>
                        <TabsContent value="reports">
                            <div className="text-muted-foreground">Reports feature coming soon.</div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}