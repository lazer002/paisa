"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, School, Building2, Users, GraduationCap,
  Briefcase, FileText, Settings, LogOut, Bell, Menu, UserCog,
  Megaphone, ClipboardList, BookOpen, Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";
import api from "@/lib/api/axios";

const sidebarItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, exact: true },
  { name: "Organizations", href: "/dashboard/organization", icon: Building2 },
  { name: "Institutes", href: "/dashboard/institutes", icon: School },
  { name: "Companies", href: "/dashboard/companies", icon: Building2 },
  { name: "Users", href: "/dashboard/users", icon: Users },
  { name: "Teachers", href: "/dashboard/teachers", icon: GraduationCap },
  { name: "Students", href: "/dashboard/students", icon: Users },
  { name: "Classes", href: "/dashboard/classes", icon: BookOpen },
  { name: "Attendance", href: "/dashboard/attendance", icon: ClipboardList },
  { name: "Announcements", href: "/dashboard/announcements", icon: Megaphone },
  { name: "Employees", href: "/dashboard/employees", icon: Briefcase },
  { name: "HR Panel", href: "/dashboard/hr", icon: UserCog },
  { name: "Payroll", href: "/dashboard/payroll", icon: Wallet },
  { name: "Billing", href: "/dashboard/billing", icon: FileText },
  { name: "Reports", href: "/dashboard/reports", icon: FileText },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
        "bg-gray-900 text-gray-100 flex flex-col transition-all duration-300 flex-shrink-0",
        collapsed ? "w-16" : "w-64"
      )}>
        <div className={cn(
          "flex items-center p-4 border-b border-gray-800",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && (
            <div>
              <div className="font-bold text-lg leading-none">Super Admin</div>
              <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[160px]">{user?.name}</div>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="text-gray-400 hover:text-white p-1">
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          <ul className="space-y-0.5 px-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    title={collapsed ? item.name : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm",
                      active ? "bg-gray-700 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
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

        <div className="p-3 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 w-full text-gray-400 hover:text-white py-2 px-3 rounded-lg hover:bg-gray-800 transition-colors text-sm",
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
              <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center font-semibold text-white text-sm">
                {user?.name?.[0]?.toUpperCase() || "S"}
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-gray-700">{user?.name}</div>
                <div className="text-xs text-gray-400">Super Admin</div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
