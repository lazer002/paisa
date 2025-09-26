"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PageHeader } from "@/components/dashboard/page-header";
import { SearchBar } from "@/components/dashboard/search-bar";
import { DataTable } from "@/components/dashboard/data-table";
import { StatsCard } from "@/components/dashboard/stats-card";
import { 
  GraduationCap, 
  UserPlus, 
  Users, 
  BookOpen, 
  Award,
  Mail,
  Phone,
  Calendar,
  Activity,
  Clock,
  Star
} from "lucide-react";
import { usersAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

interface Teacher {
  _id: string;
    name: string;
    email: string;
    subject: string;
  status: "active" | "inactive";
  userCode: string;
  profile?: {
    phone?: string;
    address?: string;
    avatarUrl?: string;
  };
  createdAt: string;
  lastLogin?: string;
  classes?: number;
  students?: number;
  rating?: number;
}

export default function TeachersPage() {
  const { user } = useAuthStore();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
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
    subjects: 0,
    avgRating: 0,
  });

  useEffect(() => {
    fetchTeachers();
  }, [currentPage, search]);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await usersAPI.getUsers({
        page: currentPage,
        limit: pageSize,
        search: search || undefined,
        role: 'teacher'
      });

      if (response.success) {
        const teachersData = response.data.users || [];
        setTeachers(teachersData);
        setTotalPages(Math.ceil((response.data.total || 0) / pageSize));
        
        // Calculate stats
        const uniqueSubjects = new Set(teachersData.map(t => t.subject)).size;
        const avgRating = teachersData.reduce((sum, t) => sum + (t.rating || 0), 0) / teachersData.length || 0;
        
        setStats({
          total: teachersData.length,
          active: teachersData.filter(t => t.status === 'active').length,
          inactive: teachersData.filter(t => t.status === 'inactive').length,
          subjects: uniqueSubjects,
          avgRating: Math.round(avgRating * 10) / 10,
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch teachers");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setForm({
      name: teacher.name,
      email: teacher.email,
      subject: teacher.subject,
      status: teacher.status,
      password: "",
    });
    setOpenDialog(true);
  };

  const handleAdd = () => {
    setSelectedTeacher(null);
    setForm({
      name: "",
      email: "",
      subject: "",
      status: "active",
      password: "",
    });
    setOpenDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject) return;

    try {
      setActionLoading(true);
      setError(null);

      if (selectedTeacher) {
        // Update existing teacher
        const response = await usersAPI.updateUser(selectedTeacher._id, {
          name: form.name,
          email: form.email,
          subject: form.subject,
          status: form.status,
        });

        if (response.success) {
          await fetchTeachers();
          setOpenDialog(false);
        }
      } else {
        // Create new teacher
        const response = await usersAPI.createUser({
          name: form.name,
          email: form.email,
          password: form.password,
          role: 'teacher',
          subject: form.subject,
          status: form.status,
        });

        if (response.success) {
          await fetchTeachers();
          setOpenDialog(false);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save teacher");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (teacher: Teacher) => {
    if (!confirm(`Are you sure you want to delete ${teacher.name}?`)) return;

    try {
      setActionLoading(true);
      const response = await usersAPI.deleteUser(teacher._id);
      
      if (response.success) {
        await fetchTeachers();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete teacher");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { key: 'avatar', label: 'Teacher', sortable: false },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'subject', label: 'Subject', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'rating', label: 'Rating', sortable: true },
    { key: 'createdAt', label: 'Joined', sortable: true },
  ];

    return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Teachers"
        description="Manage teaching staff and their subjects"
        badge={{ text: `${stats.total} teachers`, variant: "secondary" }}
        action={{
          label: "Add Teacher",
          onClick: handleAdd,
          icon: <UserPlus className="w-4 h-4" />,
        }}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Teachers"
          value={stats.total}
          icon={GraduationCap}
          iconColor="text-blue-500"
          change={{ value: "+3", type: "positive" }}
        />
        <StatsCard
          title="Active Teachers"
          value={stats.active}
          icon={Users}
          iconColor="text-green-500"
          change={{ value: "+2", type: "positive" }}
        />
        <StatsCard
          title="Subjects Covered"
          value={stats.subjects}
          icon={BookOpen}
          iconColor="text-purple-500"
          change={{ value: "+1", type: "positive" }}
        />
        <StatsCard
          title="Average Rating"
          value={`${stats.avgRating}/5`}
          icon={Star}
          iconColor="text-yellow-500"
          change={{ value: "+0.2", type: "positive" }}
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
          placeholder="Search teachers by name, email, or subject..."
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
        data={teachers}
        columns={columns}
        loading={loading}
        error={error}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={(teacher) => console.log('View teacher:', teacher)}
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
              {selectedTeacher ? "Edit Teacher" : "Add New Teacher"}
            </DialogTitle>
                    </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
                            <Input
                placeholder="Enter teacher's full name"
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <select
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full p-2 border rounded-md"
                required
              >
                <option value="">Select Subject</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Science">Science</option>
                <option value="English">English</option>
                <option value="History">History</option>
                <option value="Geography">Geography</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Art">Art</option>
                <option value="Music">Music</option>
                <option value="Physical Education">Physical Education</option>
              </select>
            </div>

            {!selectedTeacher && (
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
                    {selectedTeacher ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  selectedTeacher ? "Update Teacher" : "Create Teacher"
                )}
              </Button>
                    </DialogFooter>
          </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}