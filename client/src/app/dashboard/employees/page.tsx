"use client"
// client/src/app/dashboard/employees/page.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search } from "lucide-react";

type Employee = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: "Active" | "Inactive";
};

const mockEmployees: Employee[] = [
  { id: 1, name: "Alice Smith", email: "alice@company.com", role: "Manager", status: "Active" },
  { id: 2, name: "Bob Johnson", email: "bob@company.com", role: "Developer", status: "Inactive" },
  { id: 3, name: "Carol Lee", email: "carol@company.com", role: "Designer", status: "Active" },
];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Employee | null>(null);

  // Form state for adding employee
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "",
    status: "Active" as "Active" | "Inactive",
  });

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      e.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleView = (employee: Employee) => {
    setSelected(employee);
    setOpen(true);
  };

  const handleAdd = () => {
    if (!form.name || !form.email || !form.role) return;

    const newEmployee: Employee = {
      id: employees.length + 1,
      ...form,
    };

    setEmployees([...employees, newEmployee]);
    setForm({ name: "", email: "", role: "", status: "Active" }); // reset form
    setOpen(false);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Employees</h1>
        <Button onClick={() => { setSelected(null); setOpen(true); }}>
          Add Employee
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search employees..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
          startIcon={<Search className="w-4 h-4 text-muted-foreground" />}
        />
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Avatar</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((employee) => (
            <TableRow key={employee.id}>
              <TableCell>
                <Avatar>
                  <AvatarFallback>{employee.name[0]}</AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell>{employee.name}</TableCell>
              <TableCell>{employee.email}</TableCell>
              <TableCell>{employee.role}</TableCell>
              <TableCell>
                <Badge variant={employee.status === "Active" ? "success" : "destructive"}>
                  {employee.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Button size="sm" variant="outline" onClick={() => handleView(employee)}>
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Pagination total={1} page={1} pageSize={10} onPageChange={() => {}} />

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selected ? "Employee Details" : "Add Employee"}
            </DialogTitle>
          </DialogHeader>

          {selected ? (
            <div className="space-y-2">
              <div><strong>Name:</strong> {selected.name}</div>
              <div><strong>Email:</strong> {selected.email}</div>
              <div><strong>Role:</strong> {selected.role}</div>
              <div><strong>Status:</strong> {selected.status}</div>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleAdd(); }}>
              <Input
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Input
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <Input
                placeholder="Role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              />
            </form>
          )}

          <DialogFooter>
            <Button onClick={() => setOpen(false)}>Close</Button>
            {!selected && <Button onClick={handleAdd}>Save</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
