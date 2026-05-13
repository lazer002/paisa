"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, FileText, TrendingUp, AlertCircle, Download } from "lucide-react";

const mockInvoices = [
  { id: "INV-2024-001", plan: "Pro", amount: 4999, status: "paid", date: "2024-12-01", users: 45 },
  { id: "INV-2024-002", plan: "Pro", amount: 4999, status: "paid", date: "2025-01-01", users: 47 },
  { id: "INV-2024-003", plan: "Pro", amount: 4999, status: "paid", date: "2025-02-01", users: 50 },
  { id: "INV-2024-004", plan: "Pro", amount: 4999, status: "pending", date: "2025-03-01", users: 52 },
];

const statusColors: Record<string, string> = {
  paid: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  overdue: "bg-red-100 text-red-700",
};

export default function AdminBillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-gray-500 text-sm">Manage your subscription and invoices</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-5">
            <p className="text-sm text-blue-600 font-medium">Current Plan</p>
            <p className="text-2xl font-bold text-blue-800 mt-1">Pro</p>
            <p className="text-xs text-blue-500 mt-0.5">Up to 100 users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-500">Monthly Billing</p>
            <p className="text-2xl font-bold mt-1">₹4,999</p>
            <p className="text-xs text-gray-400 mt-0.5">Next bill: Apr 1, 2025</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-500">Active Users</p>
            <p className="text-2xl font-bold mt-1">52</p>
            <p className="text-xs text-gray-400 mt-0.5">48 seats remaining</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4" /> Payment Method</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="h-10 w-14 bg-gradient-to-r from-blue-600 to-blue-400 rounded-md flex items-center justify-center text-white text-xs font-bold">VISA</div>
              <div>
                <p className="text-sm font-medium">•••• •••• •••• 4242</p>
                <p className="text-xs text-gray-400">Expires 12/2027</p>
              </div>
              <Badge className="ml-auto text-xs bg-green-100 text-green-700 border-0">Default</Badge>
            </div>
            <Button variant="outline" size="sm" className="w-full">Update Payment Method</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Upgrade Plan</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 border rounded-lg space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">Enterprise</span>
                <span className="text-sm font-bold">₹12,999/mo</span>
              </div>
              <p className="text-xs text-gray-400">Unlimited users, priority support, custom domain, SLA</p>
              <Button size="sm" className="w-full mt-2">Upgrade to Enterprise</Button>
            </div>
            <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg text-xs text-yellow-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>You are at 52% of your user limit. Upgrade before reaching 100 users.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> Invoice History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {mockInvoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between py-3 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{inv.id}</p>
                  <p className="text-xs text-gray-400">{new Date(inv.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} · {inv.users} users</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">₹{inv.amount.toLocaleString()}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[inv.status]}`}>{inv.status}</span>
                  <button className="text-gray-400 hover:text-gray-600">
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
