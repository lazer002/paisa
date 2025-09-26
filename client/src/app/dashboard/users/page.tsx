"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/dashboard/page-header";
import { SearchBar } from "@/components/dashboard/search-bar";
import { DataTable } from "@/components/dashboard/data-table";
import { StatsCard } from "@/components/dashboard/stats-card";
import { 
  UserPlus, 
  Users, 
  UserCheck, 
  UserX, 
  Shield,
  Mail,
  Phone,
  Calendar,
  Activity
} from "lucide-react";
import { usersAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
  userCode: string;
  profile?: {
    phone?: string;
    address?: string;
    avatarUrl?: string;
  };
  createdAt: string;
  lastLogin?: string;
}

export default function UsersPage() {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "employee",
    status: "active" as "active" | "inactive",
    password: "",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  // Stats state
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    admins: 0,
  });

  useEffect(() => {
    fetchUsers();
  }, [currentPage, search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await usersAPI.getUsers({
        page: currentPage,
        limit: pageSize,
        search: search || undefined
      });

      if (response.success) {
        const usersData = response.data.users || [];
        setUsers(usersData);
        setTotalPages(Math.ceil((response.data.total || 0) / pageSize));
        
        // Calculate stats
        setStats({
          total: usersData.length,
          active: usersData.filter(u => u.status === 'active').length,
          inactive: usersData.filter(u => u.status === 'inactive').length,
          admins: usersData.filter(u => u.role === 'admin' || u.role === 'super_admin').length,
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      password: "",
    });
    setOpenDialog(true);
  };

  const handleAdd = () => {
    setSelectedUser(null);
    setForm({
      name: "",
      email: "",
      role: "employee",
      status: "active",
      password: "",
    });
    setOpenDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.role) return;

    try {
      setActionLoading(true);
      setError(null);

      if (selectedUser) {
        // Update existing user
        const response = await usersAPI.updateUser(selectedUser._id, {
          name: form.name,
          email: form.email,
          role: form.role,
          status: form.status,
        });

        if (response.success) {
          await fetchUsers();
          setOpenDialog(false);
        }
      } else {
        // Create new user
        const response = await usersAPI.createUser({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          status: form.status,
        });

        if (response.success) {
          await fetchUsers();
          setOpenDialog(false);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Are you sure you want to delete ${user.name}?`)) return;

    try {
      setActionLoading(true);
      const response = await usersAPI.deleteUser(user._id);
      
      if (response.success) {
        await fetchUsers();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete user");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { key: 'avatar', label: 'User', sortable: false },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'role', label: 'Role', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'userCode', label: 'User Code', sortable: true },
    { key: 'createdAt', label: 'Created', sortable: true },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Users"
        description="Manage system users and their permissions"
        badge={{ text: `${stats.total} total`, variant: "secondary" }}
        action={{
          label: "Add User",
          onClick: handleAdd,
          icon: <UserPlus className="w-4 h-4" />,
        }}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Users"
          value={stats.total}
          icon={Users}
          iconColor="text-blue-500"
          change={{ value: "+12", type: "positive" }}
        />
        <StatsCard
          title="Active Users"
          value={stats.active}
          icon={UserCheck}
          iconColor="text-green-500"
          change={{ value: "+8", type: "positive" }}
        />
        <StatsCard
          title="Inactive Users"
          value={stats.inactive}
          icon={UserX}
          iconColor="text-red-500"
          change={{ value: "+2", type: "negative" }}
        />
        <StatsCard
          title="Administrators"
          value={stats.admins}
          icon={Shield}
          iconColor="text-purple-500"
          change={{ value: "+1", type: "positive" }}
        />
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search and Filters */}
      <div className="flex items-center justify-between">
        <SearchBar
          placeholder="Search users by name, email, or role..."
          value={search}
          onChange={setSearch}
          showFilter={true}
          onFilter={() => console.log('Filter clicked')}
        />
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Activity className="w-4 h-4" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={users}
        columns={columns}
        loading={loading}
        error={error}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={(user) => console.log('View user:', user)}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            total={totalPages}
            page={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedUser ? "Edit User" : "Add New User"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                placeholder="Enter full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="Enter email address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            {!selectedUser && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full p-2 border rounded-md"
                required
              >
                <option value="employee">Employee</option>
                <option value="hr">HR Manager</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "inactive" })}
                className="w-full p-2 border rounded-md"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    {selectedUser ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  selectedUser ? "Update User" : "Create User"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}