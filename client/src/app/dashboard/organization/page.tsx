"use client";

import { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { organizationAPI, Organization } from "@/lib/api/organization";

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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Pencil, Trash2 } from "lucide-react";

//
// 🔹 TYPES
//
interface OrganizationResponse {
  data: Organization[];
  pagination?: {
    total: number;
    page: number;
    pages: number;
  };
}

//
// 🔹 COMPONENT
//
export default function OrganizationsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
const [customType, setCustomType] = useState("");
  const [editingOrganization, setEditingOrganization] =
    useState<Organization | null>(null);

  const [newOrganization, setNewOrganization] = useState({
    name: "",
    type: "school",
    contact: { address: "" },
  });

  //
  // 🔹 FETCH (server-side search)
  //
  const { data, isLoading, isError } = useQuery<OrganizationResponse>({
    queryKey: ["organizations", search],
    queryFn: () =>
      organizationAPI.getOrganizations({
        search,
        limit: 20,
      }),
    staleTime: 1000 * 60 * 2,
  });

  const organizations = data?.data || [];

  //
  // 🔹 CREATE
  //
  const createMutation = useMutation({
    mutationFn: organizationAPI.createOrganization,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      setOpen(false);
      setNewOrganization({
        name: "",
        type: "school",
        contact: { address: "" },
      });
    },
  });

  //
  // 🔹 UPDATE
  //
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Organization>;
    }) => organizationAPI.updateOrganization(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      setEditOpen(false);
      setEditingOrganization(null);
    },
  });

  //
  // 🔹 DELETE
  //
  const deleteMutation = useMutation({
    mutationFn: organizationAPI.deleteOrganization,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });

  //
  // 🔹 STATES
  //
  if (isLoading) {
    return <div className="p-8 text-muted-foreground">Loading...</div>;
  }

  if (isError) {
    return (
      <div className="p-8 text-red-500">
        Failed to load organizations
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Organizations</h1>
        <Button onClick={() => setOpen(true)}>+ Add</Button>
      </div>

      {/* SEARCH */}
      <Input
        placeholder="Search organizations..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {/* TABLE */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {organizations.map((o) => (
            <TableRow key={o._id}>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {o.orgCode}
              </TableCell>

              <TableCell className="font-medium">
                {o.name}
              </TableCell>

              <TableCell className="text-muted-foreground">
                {o.contact?.address || "-"}
              </TableCell>

              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {o.type}
                </Badge>
              </TableCell>

              <TableCell>
                <Badge
                  variant={
                    o.status === "active"
                      ? "default"
                      : "destructive"
                  }
                  className="capitalize text-white"
                >
                  {o.status}
                </Badge>
              </TableCell>

              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {/* EDIT */}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditingOrganization({ ...o });
                      setEditOpen(true);
                    }}
                  >
                    <Pencil size={16} />
                  </Button>

                  {/* DELETE */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-red-600"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (!confirm("Delete this organization?"))
                        return;
                      deleteMutation.mutate(o._id);
                    }}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}

          {organizations.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center py-6 text-muted-foreground"
              >
                No organizations found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* CREATE MODAL */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Organization</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={newOrganization.name}
                onChange={(e) =>
                  setNewOrganization((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label>Address</Label>
              <Input
                value={newOrganization.contact.address}
                onChange={(e) =>
                  setNewOrganization((prev) => ({
                    ...prev,
                    contact: {
                      ...prev.contact,
                      address: e.target.value,
                    },
                  }))
                }
              />
            </div>

          <div className="space-y-2">
  <Label>Type</Label>

  <Select
    value={newOrganization.type}
    onValueChange={(value) =>
      setNewOrganization((prev) => ({
        ...prev,
        type: value,
      }))
    }
  >
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>

    <SelectContent>
      <SelectItem value="school">School</SelectItem>
      <SelectItem value="college">College</SelectItem>
      <SelectItem value="company">Company</SelectItem>
      <SelectItem value="coaching">Coaching</SelectItem>
      <SelectItem value="institute">Institute</SelectItem>
      <SelectItem value="others">Other</SelectItem>
    </SelectContent>
  </Select>

  {/* 👇 CONDITIONAL INPUT */}
  {newOrganization.type === "others" && (
    <Input
      placeholder="Enter custom type (e.g. NGO, Startup)"
      value={customType}
      onChange={(e) => setCustomType(e.target.value)}
    />
  )}
</div>
          </div>

          <DialogFooter>
            <Button onClick={() => setOpen(false)}>
              Cancel
            </Button>

          <Button
  disabled={createMutation.isPending}
  onClick={() => {
    createMutation.mutate({
      ...newOrganization,

      // 👇 inject meta ONLY when "others"
      meta:
        newOrganization.type === "others"
          ? { customType }
          : undefined,
    });
  }}
>
  {createMutation.isPending ? "Creating..." : "Add"}
</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT MODAL */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        {editingOrganization && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Organization</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <Input
                value={editingOrganization.name}
                onChange={(e) =>
                  setEditingOrganization((prev) =>
                    prev
                      ? { ...prev, name: e.target.value }
                      : prev
                  )
                }
              />

              <Input
                value={editingOrganization.contact?.address || ""}
                onChange={(e) =>
                  setEditingOrganization((prev) =>
                    prev
                      ? {
                          ...prev,
                          contact: {
                            ...prev.contact,
                            address: e.target.value,
                          },
                        }
                      : prev
                  )
                }
              />

          <Select
  value={editingOrganization.status}
  onValueChange={(value: "active" | "inactive" | "suspended") =>
    setEditingOrganization((prev) =>
      prev ? { ...prev, status: value } : prev
    )
  }
>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button onClick={() => setEditOpen(false)}>
                Cancel
              </Button>

              <Button
                disabled={updateMutation.isPending}
                onClick={() =>
                  updateMutation.mutate({
                    id: editingOrganization._id,
                    data: editingOrganization,
                  })
                }
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