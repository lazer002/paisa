"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Users, BookOpen, ClipboardList,
  Megaphone, FileText, Settings, LogOut, Bell, Menu, UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";
import api from "@/lib/api/axios";

const navItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Classes", href: "/admin/classes", icon: BookOpen },
  { name: "Attendance", href: "/admin/attendance", icon: ClipboardList },
  { name: "Announcements", href: "/admin/announcements", icon: Megaphone },
  { name: "Study Materials", href: "/admin/materials", icon: FileText },
  { name: "Billing", href: "/admin/billing", icon: FileText },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
        "bg-blue-950 text-white flex flex-col transition-all duration-300 flex-shrink-0",
        collapsed ? "w-16" : "w-64"
      )}>
        <div className={cn(
          "flex items-center p-4 border-b border-blue-900",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && (
            <div>
              <div className="font-bold text-lg leading-none">Admin</div>
              <div className="text-xs text-blue-300 mt-0.5 truncate max-w-[160px]">{user?.name}</div>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="text-blue-300 hover:text-white p-1">
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
                      active ? "bg-blue-700 text-white" : "text-blue-200 hover:bg-blue-800 hover:text-white"
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

        <div className="p-3 border-t border-blue-900">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 w-full text-blue-200 hover:text-white py-2 px-3 rounded-lg hover:bg-blue-800 transition-colors text-sm",
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
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center font-semibold text-blue-700 text-sm">
                {user?.name?.[0]?.toUpperCase() || "A"}
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-gray-700">{user?.name}</div>
                <div className="text-xs text-gray-400">Admin</div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
