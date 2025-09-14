"use client";
// client/src/app/dashboard/users/page.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Search, Edit, Trash2 } from "lucide-react";

// Mock user data
const mockUsers = [
    { id: 1, name: "Alice Smith", email: "alice@example.com", role: "Admin", status: "Active" },
    { id: 2, name: "Bob Johnson", email: "bob@example.com", role: "User", status: "Inactive" },
    { id: 3, name: "Charlie Lee", email: "charlie@example.com", role: "Moderator", status: "Active" },
    // Add more users as needed
];

export default function UsersPage() {
    const [users, setUsers] = useState(mockUsers);
    const [search, setSearch] = useState("");
    const [openDialog, setOpenDialog] = useState(false);
  type User = {
  id: number
  name: string
  email: string
  role: string
  status: string
}

const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const filteredUsers = users.filter(
        (u) =>
            u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase())
    );

    const handleEdit = (user: any) => {
        setSelectedUser(user);
        setOpenDialog(true);
    };

    const handleDelete = (id: number) => {
        setUsers((prev) => prev.filter((u) => u.id !== id));
    };

    const handleDialogClose = () => {
        setOpenDialog(false);
        setSelectedUser(null);
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Users</h1>
                <Button onClick={() => setOpenDialog(true)}>
                    <UserPlus className="mr-2 h-4 w-4" /> Add User
                </Button>
            </div>
            <div className="flex items-center gap-2 mb-4">
                <div className="relative w-full max-w-sm">
                    <Input
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell>{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                                <Badge variant="outline">{user.role}</Badge>
                            </TableCell>
                            <TableCell>
                                <Badge variant={user.status === "Active" ? "default" : "destructive"}>
                                    {user.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                                <Button size="icon" variant="ghost" onClick={() => handleEdit(user)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => handleDelete(user.id)}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <div className="mt-4 flex justify-end">
           <Pagination total={1} page={1} pageSize={10} onPageChange={() => {}} />
            </div>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedUser ? "Edit User" : "Add User"}</DialogTitle>
                    </DialogHeader>
                    <form
                        className="space-y-4"
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleDialogClose();
                        }}
                    >
                        <Input placeholder="Name" defaultValue={selectedUser?.name || ""} required />
                        <Input placeholder="Email" type="email" defaultValue={selectedUser?.email || ""} required />
                        <Input placeholder="Role" defaultValue={selectedUser?.role || ""} required />
                        <DialogFooter>
                            <Button type="submit">{selectedUser ? "Save Changes" : "Add User"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}