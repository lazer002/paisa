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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";

export default function InstitutesPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editingInstitute, setEditingInstitute] = useState<any>(null);

  const [newInstitute, setNewInstitute] = useState({
    name: "",
    address: "",
    type: "school",
    status: "active",
  });

  // 🔹 Fetch
  const { data, isLoading } = useQuery({
    queryKey: ["institutes"],
    queryFn: API.institutes.getInstitutes,
  });

  const institutes = data?.data || [];

  // 🔹 Create
  const createMutation = useMutation({
    mutationFn: API.institutes.createInstitute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institutes"] });
      setNewInstitute({
        name: "",
        address: "",
        type: "school",
        status: "active",
      });
      setOpen(false);
    },
  });

  // 🔹 Delete
  const deleteMutation = useMutation({
    mutationFn: API.institutes.deleteInstitute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institutes"] });
    },
  });

  // 🔹 Update
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) =>
      API.institutes.updateInstitute(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institutes"] });
      setEditOpen(false);
      setEditingInstitute(null);
    },
  });

  // 🔹 Filter
  const filteredInstitutes = institutes.filter((i: any) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Organizations</h1>
        <Button onClick={() => setOpen(true)}>+ Add</Button>
      </div>

      {/* Search */}
      <Input
        placeholder="Search..."
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
      <TableHead>Address</TableHead>
      <TableHead>Type</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>

  <TableBody>
    {filteredInstitutes.map((i: any) => (
      <TableRow
        key={i._id}
        className="hover:bg-muted/40 transition-colors"
      >
        {/* Code */}
        <TableCell className="font-mono text-xs text-muted-foreground">
          {i.orgCode}
        </TableCell>

        {/* Name */}
        <TableCell className="font-medium">
          {i.name}
        </TableCell>

        {/* Address */}
        <TableCell className="text-muted-foreground">
          {i.address}
        </TableCell>

        {/* Type */}
        <TableCell>
          <Badge variant="outline" className="capitalize">
            {i.type}
          </Badge>
        </TableCell>

        {/* Status */}
        <TableCell>
          <Badge
            variant={
              i.status === "active"
                ? "default"
                : "destructive"
            }
            className="capitalize text-white"
          >
            {i.status}
          </Badge>
        </TableCell>

        {/* Actions */}
        <TableCell className="text-right">
          <div className="flex justify-end gap-2">

            {/* ✏️ Edit */}
            <Button
              size="icon"
              variant="ghost"
              className="hover:bg-blue-50 hover:text-blue-600 transition"
              onClick={() => {
                setEditingInstitute({ ...i });
                setEditOpen(true);
              }}
            >
              <Pencil size={16} />
            </Button>

            {/* 🗑️ Delete */}
            <Button
              size="icon"
              variant="ghost"
              className="hover:bg-red-50 hover:text-red-600 transition"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (!confirm("Delete this organization?")) return;
                deleteMutation.mutate(i._id);
              }}
            >
              <Trash2 size={16} />
            </Button>

          </div>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>

      {/* CREATE */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Organization</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label  className="py-2">Name</Label>
              <Input
                value={newInstitute.name}
                onChange={(e) =>
                  setNewInstitute({
                    ...newInstitute,
                    name: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label  className="py-2">Address</Label>
              <Input
                value={newInstitute.address}
                onChange={(e) =>
                  setNewInstitute({
                    ...newInstitute,
                    address: e.target.value,
                  })
                }
              />
            </div>

         
       <div className="space-y-2">
  <Label>Type</Label>

  <Select
    value={newInstitute.type}
    onValueChange={(value) =>
      setNewInstitute({
        ...newInstitute,
        type: value,
      })
    }
  >
    <SelectTrigger>
      <SelectValue placeholder="Select type" />
    </SelectTrigger>

    <SelectContent>
      <SelectItem value="school">School</SelectItem>
      <SelectItem value="college">College</SelectItem>
      <SelectItem value="coaching">Coaching</SelectItem>
      <SelectItem value="company"> Company</SelectItem>
    </SelectContent>
  </Select>
</div>
          
          </div>

          <DialogFooter>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              disabled={createMutation.isPending}
              onClick={() => createMutation.mutate(newInstitute)}
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT */}
      <Dialog
        open={editOpen}
        onOpenChange={(val) => {
          setEditOpen(val);
          if (!val) setEditingInstitute(null);
        }}
      >
        {editingInstitute && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Organization</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <Input
                value={editingInstitute.name}
                onChange={(e) =>
                  setEditingInstitute({
                    ...editingInstitute,
                    name: e.target.value,
                  })
                }
              />

              <Input
                value={editingInstitute.address}
                onChange={(e) =>
                  setEditingInstitute({
                    ...editingInstitute,
                    address: e.target.value,
                  })
                }
              />

              {/* ✅ STATUS EDITABLE HERE */}
         <div className="space-y-2">
  <Label>Status</Label>

  <Select
    value={editingInstitute.status}
    onValueChange={(value) =>
      setEditingInstitute({
        ...editingInstitute,
        status: value,
      })
    }
  >
    <SelectTrigger>
      <SelectValue placeholder="Select status" />
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
            </div>

            <DialogFooter>
              <Button onClick={() => setEditOpen(false)}>
                Cancel
              </Button>

              <Button
                disabled={updateMutation.isPending}
                onClick={() =>
                  updateMutation.mutate({
                    id: editingInstitute._id,
                    data: editingInstitute,
                  })
                }
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}