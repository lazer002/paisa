'use client';
import * as React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type BillingRecord = {
  id: number;
  customer: string;
  amount: number;
  date: string;
  status: 'Paid' | 'Pending' | 'Overdue';
};

const mockData: BillingRecord[] = [
  { id: 1, customer: 'Alice', amount: 120, date: '2024-06-01', status: 'Paid' },
  { id: 2, customer: 'Bob', amount: 80, date: '2024-06-05', status: 'Pending' },
  { id: 3, customer: 'Charlie', amount: 200, date: '2024-05-28', status: 'Overdue' },
  { id: 4, customer: 'David', amount: 50, date: '2024-06-03', status: 'Paid' },
  { id: 5, customer: 'Eva', amount: 300, date: '2024-05-20', status: 'Pending' },
  { id: 6, customer: 'Frank', amount: 150, date: '2024-06-02', status: 'Overdue' },
];

const statusVariants = {
  Paid: 'success',
  Pending: 'warning',
  Overdue: 'destructive',
} as const;

export default function BillingPage() {
  const [order, setOrder] = React.useState<'asc' | 'desc'>('asc');
  const [orderBy, setOrderBy] = React.useState<keyof BillingRecord>('date');
  const [page, setPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [filter, setFilter] = React.useState('');

  const handleSort = (property: keyof BillingRecord) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const filteredData = mockData.filter(
    (row) =>
      row.customer.toLowerCase().includes(filter.toLowerCase()) ||
      row.status.toLowerCase().includes(filter.toLowerCase())
  );

  const sortedData = filteredData.sort((a, b) => {
    if (orderBy === 'amount') {
      return order === 'asc' ? a.amount - b.amount : b.amount - a.amount;
    }
    if (orderBy === 'date') {
      return order === 'asc'
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    return order === 'asc'
      ? String(a[orderBy]).localeCompare(String(b[orderBy]))
      : String(b[orderBy]).localeCompare(String(a[orderBy]));
  });

  const pageCount = Math.ceil(sortedData.length / rowsPerPage);
  const paginatedData = sortedData.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Billing Dashboard</h1>

      {/* Search and Add */}
      <Card className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <Input
          placeholder="Search by customer or status"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(1);
          }}
          className="max-w-md"
        />
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">Add Invoice</Button>
      </Card>

      {/* Billing Table */}
      <div className="overflow-x-auto rounded-lg border shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              {['customer', 'amount', 'date', 'status'].map((col) => (
                <TableHead
                  key={col}
                  className={cn('cursor-pointer select-none px-4 py-3 text-left', {
                    'text-right': col === 'amount',
                  })}
                  onClick={() => handleSort(col as keyof BillingRecord)}
                >
                  {col.charAt(0).toUpperCase() + col.slice(1)}
                  {orderBy === col && (order === 'asc' ? ' ▲' : ' ▼')}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row) => (
                <TableRow key={row.id} className="hover:bg-gray-50 transition">
                  <TableCell className="px-4 py-2">{row.customer}</TableCell>
                  <TableCell className="px-4 py-2 text-right">${row.amount}</TableCell>
                  <TableCell className="px-4 py-2">{row.date}</TableCell>
                  <TableCell className="px-4 py-2">
                    <Badge variant={statusVariants[row.status]}>{row.status}</Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                  No records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <select
          value={rowsPerPage}
          onChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setPage(1);
          }}
          className="border rounded px-3 py-1"
        >
          {[5, 10, 25].map((n) => (
            <option key={n} value={n}>
              {n} / page
            </option>
          ))}
        </select>

        <Pagination
          total={sortedData.length}
          page={page}
          pageSize={rowsPerPage}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
