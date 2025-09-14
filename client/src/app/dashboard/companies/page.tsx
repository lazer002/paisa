"use client";
// client/src/app/dashboard/companies/page.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

type Company = {
  id: number;
  name: string;
  industry: string;
  status: "Active" | "Inactive";
};

const initialCompanies: Company[] = [
  { id: 1, name: "Acme Corp", industry: "Technology", status: "Active" },
  { id: 2, name: "Globex Inc", industry: "Finance", status: "Inactive" },
  { id: 3, name: "Soylent Corp", industry: "Healthcare", status: "Active" },
];

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: "", industry: "" });
  const { toast } = useToast();

  const filtered = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.industry.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (!newCompany.name || !newCompany.industry) {
      toast({
        title: "Error",
        description: "Please fill all fields",
        type: "destructive",
      });
      return;
    }


    setCompanies([
      ...companies,
      {
        id: Date.now(),
        name: newCompany.name,
        industry: newCompany.industry,
        status: "Active",
      },
    ]);

    setNewCompany({ name: "", industry: "" });
    setOpen(false);

    toast({
      title: "Success",
      description: "Company added successfully",
      type: "default",
    });
  };

  const handleStatusToggle = (id: number) => {
    setCompanies((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: c.status === "Active" ? "Inactive" : "Active" }
          : c
      )
    );

    const company = companies.find((c) => c.id === id);
    toast({
      title: "Status Updated",
      description: `${company?.name} is now ${
        company?.status === "Active" ? "Inactive" : "Active"
      }`,
      type: "default",
    });
  };

  const handleDelete = (id: number) => {
    const company = companies.find((c) => c.id === id);
    setCompanies((prev) => prev.filter((c) => c.id !== id));

    toast({
      title: "Deleted",
      description: `${company?.name} has been removed`,
      type: "destructive",
    });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Companies</h1>
        <Button onClick={() => setOpen(true)}>Add Company</Button>
      </div>

      <Input
        placeholder="Search companies..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 max-w-xs"
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Industry</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((company) => (
            <TableRow key={company.id}>
              <TableCell>{company.name}</TableCell>
              <TableCell>{company.industry}</TableCell>
              <TableCell>
                <Badge variant={company.status === "Active" ? "default" : "secondary"}>
                  {company.status}
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
                    <DropdownMenuItem onClick={() => handleStatusToggle(company.id)}>
                      {company.status === "Active" ? "Deactivate" : "Activate"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(company.id)}>
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No companies found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Company</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Company Name"
              value={newCompany.name}
              onChange={(e) =>
                setNewCompany((c) => ({ ...c, name: e.target.value }))
              }
            />
            <Input
              placeholder="Industry"
              value={newCompany.industry}
              onChange={(e) =>
                setNewCompany((c) => ({ ...c, industry: e.target.value }))
              }
            />
          </div>
          <DialogFooter>
            <Button onClick={handleAdd}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
