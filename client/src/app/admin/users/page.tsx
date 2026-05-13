"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, UserX, Plus, Search, ShieldOff } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { can } from "@/lib/permissions";
import API from "@/lib/api";

const roleColors: Record<string, string> = {
  teacher: "bg-emerald-100 text-emerald-700",
  student: "bg-purple-100 text-purple-700",
  employee: "bg-blue-100 text-blue-700",
  hr: "bg-orange-100 text-orange-700",
  admin: "bg-red-100 text-red-700",
  super_admin: "bg-gray-900 text-white",
};

// Roles that admin can create
const ADMIN_CREATABLE_ROLES = ["teacher", "student", "employee", "hr"];

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const { user: me } = useAuthStore();
  const myRole = me?.role as any;

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "teacher" });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", roleFilter],
    queryFn: () => API.users.getUsers(roleFilter !== "all" ? { role: roleFilter } : {}),
  });

  const users: any[] = data?.data?.data || data?.data || [];

  const createMutation = useMutation({
    mutationFn: API.users.createUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setOpen(false);
      setForm({ name: "", email: "", password: "", role: "teacher" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => API.users.updateUser(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); setEditOpen(false); setEditing(null); },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => API.users.deleteUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const filtered = users.filter((u: any) => {
    if (!search) return true;
    return [u.name, u.email, u.userCode].join(" ").toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-gray-500 text-sm">Manage teachers, students, and staff in your institute</p>
        </div>
        {can(myRole, "canCreateUsers") && (
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add User
          </Button>
        )}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input className="pl-9" placeholder="Search by name, email or ID..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="teacher">Teacher</SelectItem>
            <SelectItem value="student">Student</SelectItem>
            <SelectItem value="employee">Employee</SelectItem>
            <SelectItem value="hr">HR</SelectItem>
            {myRole === "super_admin" && <SelectItem value="admin">Admin</SelectItem>}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              {can(myRole, "canEditUsers") && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">No users found</TableCell></TableRow>
            ) : filtered.map((u: any) => (
              <TableRow key={u._id}>
                <TableCell className="font-mono text-xs text-gray-500">{u.userCode}</TableCell>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell className="text-gray-600 text-sm">{u.email}</TableCell>
                <TableCell>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${roleColors[u.role] || "bg-gray-100 text-gray-700"}`}>
                    {u.role.replace("_", " ")}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={u.status === "active" ? "default" : "destructive"} className="capitalize text-xs">
                    {u.status}
                  </Badge>
                </TableCell>
                {can(myRole, "canEditUsers") && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8"
                        onClick={() => { setEditing({ ...u }); setEditOpen(true); }}
                        title="Edit user">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {can(myRole, "canDeactivateUsers") && u._id !== me?._id && (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500"
                          disabled={deactivateMutation.isPending}
                          onClick={() => { if (confirm(`${u.status === "active" ? "Deactivate" : "This user is already inactive"}. Proceed?`)) deactivateMutation.mutate(u._id); }}
                          title="Deactivate user">
                          {u.status === "active" ? <UserX className="h-4 w-4" /> : <ShieldOff className="h-4 w-4 text-gray-300" />}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New User</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Email address" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <Input placeholder="Password (min 6 characters)" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ADMIN_CREATABLE_ROLES.map(r => (
                  <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                ))}
                {myRole === "super_admin" && <SelectItem value="admin">Admin</SelectItem>}
              </SelectContent>
            </Select>
          </div>
          {createMutation.isError && (
            <p className="text-sm text-red-500">{(createMutation.error as any)?.response?.data?.message || "Failed to create user"}</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={!form.name || !form.email || !form.password || createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {editing && (
        <Dialog open={editOpen} onOpenChange={v => { setEditOpen(v); if (!v) setEditing(null); }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit User — {editing.userCode}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Full Name</label>
                <Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Status</label>
                <Select value={editing.status} onValueChange={v => setEditing({ ...editing, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Super admin can change roles */}
              {myRole === "super_admin" && (
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Role</label>
                  <Select value={editing.role} onValueChange={v => setEditing({ ...editing, role: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["teacher", "student", "employee", "hr", "admin"].map(r => (
                        <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            {updateMutation.isError && (
              <p className="text-sm text-red-500">{(updateMutation.error as any)?.response?.data?.message || "Failed to update user"}</p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button onClick={() => updateMutation.mutate({ id: editing._id, data: { name: editing.name, status: editing.status, role: editing.role } })} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
