"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Calendar, Wallet, Megaphone, User,
  LogOut, Bell, Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";
import api from "@/lib/api/axios";

const navItems = [
  { name: "Dashboard", href: "/employee", icon: LayoutDashboard, exact: true },
  { name: "Leave Requests", href: "/employee/leaves", icon: Calendar },
  { name: "Payslips", href: "/employee/payslips", icon: Wallet },
  { name: "Announcements", href: "/employee/announcements", icon: Megaphone },
  { name: "Profile", href: "/employee/profile", icon: User },
];

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    try { await api.post("/auth/logout"); } catch {}
    logout();
    router.push("/login");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className={cn(
        "bg-slate-800 text-white flex flex-col transition-all duration-300 flex-shrink-0",
        collapsed ? "w-16" : "w-64"
      )}>
        <div className={cn(
          "flex items-center p-4 border-b border-slate-700",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && (
            <div>
              <div className="font-bold text-lg leading-none">Employee</div>
              <div className="text-xs text-slate-300 mt-0.5 truncate max-w-[160px]">{user?.name}</div>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="text-slate-300 hover:text-white p-1">
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          <ul className="space-y-0.5 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    title={collapsed ? item.name : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm",
                      active ? "bg-slate-600 text-white" : "text-slate-300 hover:bg-slate-700 hover:text-white"
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && <span>{item.name}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-3 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 w-full text-slate-300 hover:text-white py-2 px-3 rounded-lg hover:bg-slate-700 transition-colors text-sm",
              collapsed && "justify-center"
            )}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-500 capitalize">
            {pathname.split("/").filter(Boolean).slice(-1)[0]?.replace(/-/g, " ") || "Dashboard"}
          </h2>
          <div className="flex items-center gap-4">
            <button className="relative text-gray-500 hover:text-gray-700">
              <Bell className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center font-semibold text-slate-700 text-sm">
                {user?.name?.[0]?.toUpperCase() || "E"}
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-gray-700">{user?.name}</div>
                <div className="text-xs text-gray-400">{user?.userCode}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
