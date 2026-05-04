"use client";

import { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { API } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { Pencil, Trash2 } from "lucide-react";

export default function UsersPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });

  // 🔹 Fetch users
  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: API.users.getUsers,
  });

  const users = data?.data || [];

  // 🔹 Create
  const createMutation = useMutation({
    mutationFn: API.users.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setOpen(false);
      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "student",
      });
    },
  });

  // 🔹 Update
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) =>
      API.users.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditOpen(false);
      setEditingUser(null);
    },
  });

  // 🔹 Delete
  const deleteMutation = useMutation({
    mutationFn: API.users.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  // 🔹 Filter
  const filteredUsers = users.filter((u: any) =>
    [u.name, u.email]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // 🔹 Loading
  if (isLoading) {
    return (
      <div className="p-8 text-muted-foreground">
        Loading users...
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Users</h1>
        <Button onClick={() => setOpen(true)}>+ Add User</Button>
      </div>

      {/* Search */}
      <Input
        placeholder="Search users..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {filteredUsers.map((u: any) => (
            <TableRow key={u._id}>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {u.userCode}
              </TableCell>

              <TableCell className="font-medium">
                {u.name}
              </TableCell>

              <TableCell>{u.email}</TableCell>

              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {u.role.replace("_", " ")}
                </Badge>
              </TableCell>

              <TableCell>
                <Badge
                  variant={
                    u.status === "active"
                      ? "default"
                      : "destructive"
                  }
                  className="capitalize"
                >
                  {u.status}
                </Badge>
              </TableCell>

              {/* Actions */}
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {/* Edit */}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditingUser(
                        JSON.parse(JSON.stringify(u))
                      );
                      setEditOpen(true);
                    }}
                  >
                    <Pencil size={16} />
                  </Button>

                  {/* Delete */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-red-600"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (!confirm("Delete user?")) return;
                      deleteMutation.mutate(u._id);
                    }}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}

          {/* Empty state */}
          {filteredUsers.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center py-6 text-muted-foreground"
              >
                No users found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* CREATE */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Name"
              value={newUser.name}
              onChange={(e) =>
                setNewUser({
                  ...newUser,
                  name: e.target.value,
                })
              }
            />

            <Input
              placeholder="Email"
              value={newUser.email}
              onChange={(e) =>
                setNewUser({
                  ...newUser,
                  email: e.target.value,
                })
              }
            />

            <Input
              placeholder="Password"
              type="password"
              value={newUser.password}
              onChange={(e) =>
                setNewUser({
                  ...newUser,
                  password: e.target.value,
                })
              }
            />

            {/* Role */}
            <Select
              value={newUser.role}
              onValueChange={(value) =>
                setNewUser({ ...newUser, role: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Role" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button onClick={() => setOpen(false)}>Cancel</Button>

            <Button
              onClick={() => createMutation.mutate(newUser)}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending
                ? "Creating..."
                : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT */}
      <Dialog
        open={editOpen}
        onOpenChange={(val) => {
          setEditOpen(val);
          if (!val) setEditingUser(null);
        }}
      >
        {editingUser && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <Input
                value={editingUser.name}
                onChange={(e) =>
                  setEditingUser({
                    ...editingUser,
                    name: e.target.value,
                  })
                }
              />

              <Input
                value={editingUser.email}
                onChange={(e) =>
                  setEditingUser({
                    ...editingUser,
                    email: e.target.value,
                  })
                }
              />

              {/* Status */}
              <Select
                value={editingUser.status}
                onValueChange={(value) =>
                  setEditingUser({
                    ...editingUser,
                    status: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="active">
                    Active
                  </SelectItem>
                  <SelectItem value="inactive">
                    Inactive
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button onClick={() => setEditOpen(false)}>
                Cancel
              </Button>

              <Button
                onClick={() =>
                  updateMutation.mutate({
                    id: editingUser._id,
                    data: editingUser,
                  })
                }
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending
                  ? "Saving..."
                  : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}