"use client";
// client/src/app/dashboard/classes/page.tsx
import React, { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { ChevronUp, ChevronDown, Search } from "lucide-react";

interface ClassItem {
  id: number;
  name: string;
  teacher: string;
  students: number;
}

const mockClasses: ClassItem[] = [
  { id: 1, name: "Math 101", teacher: "Alice", students: 30 },
  { id: 2, name: "History 201", teacher: "Bob", students: 25 },
  { id: 3, name: "Science 301", teacher: "Carol", students: 28 },
  { id: 4, name: "Physics 401", teacher: "Dave", students: 32 },
  { id: 5, name: "Chemistry 501", teacher: "Eve", students: 27 },
  { id: 6, name: "Biology 601", teacher: "Frank", students: 22 },
];

export default function ClassesPage() {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<keyof ClassItem>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const filtered = useMemo(() => {
    let data = mockClasses.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.teacher.toLowerCase().includes(search.toLowerCase())
    );

    data.sort((a, b) => {
      if (a[sortKey] < b[sortKey]) return sortAsc ? -1 : 1;
      if (a[sortKey] > b[sortKey]) return sortAsc ? 1 : -1;
      return 0;
    });

    return data;
  }, [search, sortKey, sortAsc]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / pageSize);

  const toggleSort = (key: keyof ClassItem) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  return (
    <div className="p-6">
      <Card className="space-y-4">
        <CardHeader>
          <CardTitle>Classes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search classes or teachers..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="max-w-sm pl-10"
            />
            {/* <Search className="absolute left-3 h-4 w-4 text-muted-foreground" /> */}
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => toggleSort("name")}
                  >
                    Name
                    {sortKey === "name" &&
                      (sortAsc ? (
                        <ChevronUp className="ml-1 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
                <TableHead>
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => toggleSort("teacher")}
                  >
                    Teacher
                    {sortKey === "teacher" &&
                      (sortAsc ? (
                        <ChevronUp className="ml-1 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
                <TableHead>
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => toggleSort("students")}
                  >
                    Students
                    {sortKey === "students" &&
                      (sortAsc ? (
                        <ChevronUp className="ml-1 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.teacher}</TableCell>
                  <TableCell>{c.students}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex justify-end mt-4">
            <Pagination
              total={filtered.length}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
