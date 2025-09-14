"use client";
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { Download, Filter, Search } from "lucide-react";

// Mock report data
const reports = [
  { id: 1, name: "Sales Report", date: "2024-06-01", status: "Completed" },
  { id: 2, name: "Inventory Report", date: "2024-06-02", status: "Pending" },
  { id: 3, name: "Customer Report", date: "2024-06-03", status: "Completed" },
];

// Columns for DataTable
const columns = [
  { accessorKey: "name", header: "Report Name" },
  { accessorKey: "date", header: "Date" },
  { accessorKey: "status", header: "Status" },
];

export default function ReportsPage() {
  const [search, setSearch] = useState("");

  const filteredReports = reports.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6  mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reports</h1>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" /> Export
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Report Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
            </TabsList>

            {/* All Reports Tab */}
            <TabsContent value="all" className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search reports..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="max-w-md"
                  startIcon={<Search className="w-4 h-4 text-gray-400" />}
                />
                <Button variant="outline" size="icon">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
              <DataTable columns={columns} data={filteredReports} />
            </TabsContent>

            {/* Completed Reports Tab */}
            <TabsContent value="completed">
              <DataTable
                columns={columns}
                data={filteredReports.filter((r) => r.status === "Completed")}
              />
            </TabsContent>

            {/* Pending Reports Tab */}
            <TabsContent value="pending">
              <DataTable
                columns={columns}
                data={filteredReports.filter((r) => r.status === "Pending")}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
