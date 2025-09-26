"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  School, 
  Building2, 
  Users, 
  GraduationCap, 
  Briefcase, 
  UserCog,
  TrendingUp,
  TrendingDown,
  Activity
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { institutesAPI, usersAPI } from "@/lib/api";

interface DashboardStats {
  institutes: number;
  companies: number;
  users: number;
  teachers: number;
  students: number;
  employees: number;
  hr: number;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Fetch data based on user role
        const [institutesRes, usersRes] = await Promise.all([
          institutesAPI.getInstitutes(),
          usersAPI.getUsers()
        ]);

        // Calculate stats
        const institutes = institutesRes.data || [];
        const users = usersRes.data || [];
        
        const statsData: DashboardStats = {
          institutes: institutes.length,
          companies: institutes.filter((i: any) => i.type === 'company').length,
          users: users.length,
          teachers: users.filter((u: any) => u.role === 'teacher').length,
          students: users.filter((u: any) => u.role === 'student').length,
          employees: users.filter((u: any) => u.role === 'employee').length,
          hr: users.filter((u: any) => u.role === 'hr').length,
        };

        setStats(statsData);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { 
      title: "Institutes", 
      value: stats?.institutes || 0, 
      icon: <School className="w-6 h-6 text-blue-500" />,
      change: "+2",
      changeType: "positive" as const
    },
    { 
      title: "Companies", 
      value: stats?.companies || 0, 
      icon: <Building2 className="w-6 h-6 text-green-500" />,
      change: "+1",
      changeType: "positive" as const
    },
    { 
      title: "Total Users", 
      value: stats?.users || 0, 
      icon: <Users className="w-6 h-6 text-purple-500" />,
      change: "+12",
      changeType: "positive" as const
    },
    { 
      title: "Teachers", 
      value: stats?.teachers || 0, 
      icon: <GraduationCap className="w-6 h-6 text-orange-500" />,
      change: "+3",
      changeType: "positive" as const
    },
    { 
      title: "Students", 
      value: stats?.students || 0, 
      icon: <Users className="w-6 h-6 text-indigo-500" />,
      change: "+8",
      changeType: "positive" as const
    },
    { 
      title: "Employees", 
      value: stats?.employees || 0, 
      icon: <Briefcase className="w-6 h-6 text-emerald-500" />,
      change: "+2",
      changeType: "positive" as const
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your HRM system today.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Activity className="w-4 h-4" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {stat.changeType === "positive" ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
                <span className={stat.changeType === "positive" ? "text-green-500" : "text-red-500"}>
                  {stat.change}
                </span>
                <span>from last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left">
              <UserCog className="w-8 h-8 text-blue-500 mb-2" />
              <div className="font-medium">Add User</div>
              <div className="text-sm text-muted-foreground">Create new user account</div>
            </button>
            <button className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left">
              <School className="w-8 h-8 text-green-500 mb-2" />
              <div className="font-medium">Add Institute</div>
              <div className="text-sm text-muted-foreground">Register new institute</div>
            </button>
            <button className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left">
              <Briefcase className="w-8 h-8 text-purple-500 mb-2" />
              <div className="font-medium">Add Employee</div>
              <div className="text-sm text-muted-foreground">Register new employee</div>
            </button>
            <button className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left">
              <Activity className="w-8 h-8 text-orange-500 mb-2" />
              <div className="font-medium">View Reports</div>
              <div className="text-sm text-muted-foreground">Generate system reports</div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
