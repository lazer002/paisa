"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  School,
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  ClipboardList,
  Megaphone,
  Briefcase,
  UserCog,
  Wallet,
  FileText,
  Settings,
  LogOut,
  Bell,
  Search,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";

const sidebarItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Institutes", href: "/dashboard/institutes", icon: School },
  { name: "Companies", href: "/dashboard/companies", icon: Building2 },
  { name: "Users", href: "/dashboard/users", icon: Users },
  { name: "Teachers", href: "/dashboard/teachers", icon: GraduationCap },
  { name: "Students", href: "/dashboard/students", icon: Users },
  { name: "Classes", href: "/dashboard/classes", icon: Calendar },
  { name: "Attendance", href: "/dashboard/attendance", icon: ClipboardList },
  { name: "Study Material", href: "/dashboard/study-material", icon: BookOpen },
  { name: "Announcements", href: "/dashboard/announcements", icon: Megaphone },
  { name: "Employees", href: "/dashboard/employees", icon: Briefcase },
  { name: "HR Panel", href: "/dashboard/hr", icon: UserCog },
  { name: "Payroll", href: "/dashboard/payroll", icon: Wallet },
  { name: "Billing", href: "/dashboard/billing", icon: FileText },
  { name: "Payments", href: "/dashboard/payments", icon: Wallet },
  { name: "Reports", href: "/dashboard/reports", icon: FileText },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await axios.post("/api/logout"); // backend should clear cookies
    router.push("/login");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-gray-900 text-gray-100 flex flex-col transition-all duration-300",
          collapsed ? "w-20" : "w-64"
        )}
      >
        {/* Logo / Collapse */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <span className={cn("font-bold text-xl", collapsed && "hidden")}>
            Admin Panel
          </span>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-400 hover:text-white"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Sidebar Items */}
        <nav className="flex-1 overflow-y-auto">
          <ul className="space-y-1 p-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
                      active
                        ? "bg-gray-800 text-white"
                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {!collapsed && <span>{item.name}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full text-gray-400 hover:text-white"
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between bg-white shadow px-6 py-4">
          <div className="flex items-center gap-3 w-full">
            <Search className="h-5 w-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search..."
              className="flex-1 border-none outline-none bg-transparent text-sm text-gray-700"
            />
          </div>
          <div className="flex items-center gap-6">
            <button className="relative text-gray-600 hover:text-gray-900">
              <Bell className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-4 w-4 flex items-center justify-center text-xs">
                3
              </span>
            </button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gray-300" />
              <span className="text-sm font-medium text-gray-700">
                Admin User
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
