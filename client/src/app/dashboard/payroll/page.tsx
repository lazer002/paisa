"use client";
// client/src/app/dashboard/payroll/page.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
// import { PayrollTableColumns, payrollData, Payroll } from "./payrollData";
import { ColumnDef } from "@tanstack/react-table";



export default function PayrollDashboardPage() {
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);

    const filteredData = payrollData.filter(
        (item) =>
            item.employee.toLowerCase().includes(search.toLowerCase()) ||
            item.department.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Payroll Management</CardTitle>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button>Add Payroll</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Payroll</DialogTitle>
                            </DialogHeader>
                            {/* Add payroll form here */}
                            <div className="space-y-4">
                                <Input placeholder="Employee Name" />
                                <Input placeholder="Department" />
                                <Input placeholder="Amount" type="number" />
                                <Button>Add</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center mb-4 gap-2">
                        <Input
                            placeholder="Search employee or department..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="max-w-xs"
                        />
                        <Badge variant="outline">{filteredData.length} results</Badge>
                    </div>
                    <DataTable
                        columns={PayrollTableColumns({
                            onView: (row) => {
                                setSelectedPayroll(row);
                                setOpen(true);
                            },
                        })}
                        data={filteredData}
                    />
                </CardContent>
            </Card>
            <Dialog open={!!selectedPayroll} onOpenChange={() => setSelectedPayroll(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Payroll Details</DialogTitle>
                    </DialogHeader>
                    {selectedPayroll && (
                        <div className="space-y-2">
                            <div>
                                <strong>Employee:</strong> {selectedPayroll.employee}
                            </div>
                            <div>
                                <strong>Department:</strong> {selectedPayroll.department}
                            </div>
                            <div>
                                <strong>Amount:</strong> ${selectedPayroll.amount}
                            </div>
                            <div>
                                <strong>Status:</strong> <Badge>{selectedPayroll.status}</Badge>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

// payrollData.tsx (mock data and columns)
export type Payroll = {
    id: string;
    employee: string;
    department: string;
    amount: number;
    status: "Paid" | "Pending" | "Failed";
};

export const payrollData: Payroll[] = [
    { id: "1", employee: "Alice Smith", department: "Engineering", amount: 3500, status: "Paid" },
    { id: "2", employee: "Bob Johnson", department: "HR", amount: 2800, status: "Pending" },
    { id: "3", employee: "Charlie Lee", department: "Finance", amount: 4000, status: "Paid" },
    { id: "4", employee: "Dana White", department: "Engineering", amount: 3200, status: "Failed" },
];


export function PayrollTableColumns({ onView }: { onView: (row: Payroll) => void }): ColumnDef<Payroll>[] {
    return [
        { accessorKey: "employee", header: "Employee" },
        { accessorKey: "department", header: "Department" },
        { accessorKey: "amount", header: "Amount", cell: ({ row }) => `$${row.original.amount}` },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => <Badge variant={row.original.status === "Paid" ? "success" : row.original.status === "Pending" ? "warning" : "destructive"}>{row.original.status}</Badge>,
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <Button size="sm" variant="outline" onClick={() => onView(row.original)}>
                    View
                </Button>
            ),
        },
    ];
}