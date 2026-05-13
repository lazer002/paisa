"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Bell, Shield, Building2, CheckCircle } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import api from "@/lib/api/axios";

export default function AdminSettingsPage() {
  const { user } = useAuthStore();
  const [saved, setSaved] = useState<string | null>(null);

  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    phone: user?.profile?.phone || "",
    address: user?.profile?.address || "",
  });

  const [notifSettings, setNotifSettings] = useState({
    leaveApprovals: true,
    newUsers: true,
    announcements: false,
    payroll: true,
  });

  const profileMutation = useMutation({
    mutationFn: (data: any) => api.put("/auth/profile", data),
    onSuccess: () => { setSaved("profile"); setTimeout(() => setSaved(null), 3000); },
  });

  const handleSaveProfile = () => {
    profileMutation.mutate({ name: profileForm.name, profile: { phone: profileForm.phone, address: profileForm.address } });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-500 text-sm">Manage your account and institute preferences</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" /> Admin Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 pb-2">
            <div className="h-14 w-14 rounded-full bg-blue-800 flex items-center justify-center font-bold text-xl text-white">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold">{user?.name}</p>
              <p className="text-sm text-gray-400">{user?.email}</p>
              <p className="text-xs text-gray-400 font-mono">{user?.userCode}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Full Name</label>
              <Input value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Phone Number</label>
              <Input value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Address</label>
              <Input value={profileForm.address} onChange={e => setProfileForm({ ...profileForm, address: e.target.value })} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleSaveProfile} disabled={profileMutation.isPending} size="sm">
              {profileMutation.isPending ? "Saving..." : "Save Profile"}
            </Button>
            {saved === "profile" && <span className="text-sm text-green-600 flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Saved!</span>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4" /> Notification Preferences</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: "leaveApprovals", label: "Leave approval requests", desc: "When employees apply for leave" },
            { key: "newUsers", label: "New user registrations", desc: "When a new user is added to the system" },
            { key: "announcements", label: "New announcements", desc: "When announcements are posted" },
            { key: "payroll", label: "Payroll processing", desc: "When payroll is processed or paid" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </div>
              <button
                onClick={() => setNotifSettings({ ...notifSettings, [item.key]: !notifSettings[item.key as keyof typeof notifSettings] })}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${notifSettings[item.key as keyof typeof notifSettings] ? "bg-blue-600" : "bg-gray-200"}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${notifSettings[item.key as keyof typeof notifSettings] ? "translate-x-4" : "translate-x-1"}`} />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" /> Account Details</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Admin ID", value: user?.userCode },
            { label: "Email", value: user?.email },
            { label: "Role", value: "Admin" },
            { label: "Status", value: user?.status },
          ].map((item) => (
            <div key={item.label} className="flex justify-between text-sm py-1.5 border-b last:border-0">
              <span className="text-gray-500">{item.label}</span>
              <span className="font-medium capitalize">{item.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
