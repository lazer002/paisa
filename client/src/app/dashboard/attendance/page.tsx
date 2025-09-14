'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

type AttendanceRecord = {
  id: number;
  name: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late';
};

const initialData: AttendanceRecord[] = [
  { id: 1, name: 'Alice', date: '2024-06-10', status: 'Present' },
  { id: 2, name: 'Bob', date: '2024-06-10', status: 'Absent' },
  { id: 3, name: 'Charlie', date: '2024-06-10', status: 'Late' },
];

const statusVariants = {
  Present: 'success',
  Absent: 'destructive',
  Late: 'warning',
} as const;

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>(initialData);
  const [filter, setFilter] = useState<string>('All');
  const [search, setSearch] = useState<string>('');
  const [openDialog, setOpenDialog] = useState(false);
  const [newRecord, setNewRecord] = useState<Omit<AttendanceRecord, 'id'>>({
    name: '',
    date: '',
    status: 'Present',
  });

  const filteredRecords = records.filter(
    (rec) =>
      (filter === 'All' || rec.status === filter) &&
      rec.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    setRecords([
      ...records,
      { ...newRecord, id: records.length ? records[records.length - 1].id + 1 : 1 },
    ]);
    setOpenDialog(false);
    setNewRecord({ name: '', date: '', status: 'Present' });
  };

  return (
    <div className="p-6  mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Attendance Dashboard</h1>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex gap-2 flex-1">
              <Input
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className="border rounded px-3 py-2"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Late">Late</option>
              </select>
            </div>
            <Button onClick={() => setOpenDialog(true)}>Add Attendance</Button>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No records found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((rec) => (
                  <TableRow key={rec.id}>
                    <TableCell>{rec.name}</TableCell>
                    <TableCell>{rec.date}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[rec.status]}>{rec.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Attendance Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Attendance</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Name"
              value={newRecord.name}
              onChange={(e) => setNewRecord({ ...newRecord, name: e.target.value })}
              required
            />
            <Input
              type="date"
              value={newRecord.date}
              onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
              required
            />
            <select
              className="border rounded px-3 py-2 w-full"
              value={newRecord.status}
              onChange={(e) =>
                setNewRecord({ ...newRecord, status: e.target.value as AttendanceRecord['status'] })
              }
            >
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Late">Late</option>
            </select>
          </div>
          <DialogFooter className="mt-4 flex gap-2">
            <Button onClick={handleAdd} disabled={!newRecord.name || !newRecord.date}>
              Add
            </Button>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
