'use client';
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";

type Payment = {
  id: string;
  date: string;
  amount: number;
  status: "Paid" | "Pending" | "Failed";
  method: string;
};

const mockPayments: Payment[] = [
  { id: "1", date: "2024-06-01", amount: 120.5, status: "Paid", method: "Credit Card" },
  { id: "2", date: "2024-06-03", amount: 75.0, status: "Pending", method: "PayPal" },
  { id: "3", date: "2024-06-05", amount: 200.0, status: "Failed", method: "Bank Transfer" },
  { id: "4", date: "2024-06-07", amount: 50.0, status: "Paid", method: "Cash" },
];

export default function PaymentsPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Payment | null>(null);
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const filtered = mockPayments.filter(
    (p) =>
      p.id.includes(search) ||
      p.method.toLowerCase().includes(search.toLowerCase()) ||
      p.status.toLowerCase().includes(search.toLowerCase())
  );

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const statusVariant = (status: Payment['status']) =>
    status === "Paid" ? "success" : status === "Pending" ? "warning" : "destructive";

  return (
    <div className="p-8 mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Payments Dashboard</h1>

      <Card className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4">
        <Input
          placeholder="Search payments..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="max-w-md"
          startIcon={<Search className="w-4 h-4 text-gray-400" />}
        />
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setOpen(true)}>
          Add Payment
        </Button>
      </Card>

      <div className="overflow-x-auto rounded-lg border shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length > 0 ? (
              paged.map((payment) => (
                <TableRow key={payment.id} className="hover:bg-gray-50 transition">
                  <TableCell>{payment.id}</TableCell>
                  <TableCell>{payment.date}</TableCell>
                  <TableCell className="text-right">${payment.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(payment.status)}>
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{payment.method}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setSelected(payment); setOpen(true); }}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                  No payments found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end mt-4">
        <Pagination
          total={filtered.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>

      <Dialog open={open} onOpenChange={() => { setOpen(false); setSelected(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected ? "Payment Details" : "Add Payment"}</DialogTitle>
          </DialogHeader>
          {selected ? (
            <div className="space-y-2">
              <div><span className="font-semibold">ID:</span> {selected.id}</div>
              <div><span className="font-semibold">Date:</span> {selected.date}</div>
              <div><span className="font-semibold">Amount:</span> ${selected.amount.toFixed(2)}</div>
              <div>
                <span className="font-semibold">Status:</span>{" "}
                <Badge variant={statusVariant(selected.status)}>{selected.status}</Badge>
              </div>
              <div><span className="font-semibold">Method:</span> {selected.method}</div>
            </div>
          ) : (
            <form className="space-y-4">
              <Input placeholder="Amount" type="number" />
              <Input placeholder="Date" type="date" />
              <Input placeholder="Method" />
            </form>
          )}
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setOpen(false); setSelected(null); }}>
              Close
            </Button>
            {!selected && <Button>Add</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
