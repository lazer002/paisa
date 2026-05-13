"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/lib/store";
import api from "@/lib/api/axios";

export default function EmployeeProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({
    name: user?.name || "",
    profile: {
      phone: user?.profile?.phone || "",
      address: user?.profile?.address || "",
    },
  });
  const [saved, setSaved] = useState(false);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put("/auth/profile", data);
      return res.data;
    },
    onSuccess: (data) => {
      updateUser({ name: form.name, profile: form.profile });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-gray-500 text-sm">Manage your personal information</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Profile Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-slate-200 flex items-center justify-center font-bold text-2xl text-slate-600">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-800">{user?.name}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <p className="text-xs text-gray-400 mt-0.5">{user?.userCode}</p>
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Full Name</label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Phone Number</label>
              <Input value={form.profile.phone} onChange={e => setForm({ ...form, profile: { ...form.profile, phone: e.target.value } })} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Address</label>
              <Input value={form.profile.address} onChange={e => setForm({ ...form, profile: { ...form.profile, address: e.target.value } })} />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
            {saved && <span className="text-sm text-green-600">Changes saved!</span>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Account Details</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Employee ID</span>
            <span className="font-mono font-medium">{user?.userCode}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Email</span>
            <span>{user?.email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Role</span>
            <span className="capitalize">{user?.role}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Status</span>
            <span className="capitalize text-green-600">{user?.status}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
