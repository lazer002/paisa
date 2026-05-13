"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import API from "@/lib/api";

export default function HREmployeesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "employee" });

  const { data, isLoading } = useQuery({
    queryKey: ["hr-employees"],
    queryFn: () => API.users.getUsers(),
  });

  const allUsers = (data as any)?.data || data || [];
  const employees = allUsers.filter((u: any) => u.role === "employee");

  const filtered = employees.filter((u: any) =>
    [u.name, u.email, u.userCode].join(" ").toLowerCase().includes(search.toLowerCase())
  );

  const createMutation = useMutation({
    mutationFn: API.users.createUser,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr-employees"] }); setOpen(false); setForm({ name: "", email: "", password: "", role: "employee" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: API.users.deleteUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hr-employees"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-gray-500 text-sm">Manage your workforce</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Employee
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input className="pl-9" placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-400">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-400">No employees found</TableCell></TableRow>
            ) : filtered.map((u: any) => (
              <TableRow key={u._id}>
                <TableCell className="font-mono text-xs text-gray-500">{u.userCode}</TableCell>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell className="text-gray-600">{u.email}</TableCell>
                <TableCell>
                  <Badge variant={u.status === "active" ? "default" : "destructive"} className="text-xs capitalize">{u.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500"
                    onClick={() => { if (confirm("Remove employee?")) deleteMutation.mutate(u._id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Employee</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <Input placeholder="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate(form as any)} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Adding..." : "Add Employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
