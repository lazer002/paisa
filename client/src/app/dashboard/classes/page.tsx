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
  Calendar, 
  Plus, 
  Users, 
  GraduationCap, 
  BookOpen,
  Clock,
  Activity,
  TrendingUp,
  UserCheck
} from "lucide-react";
import { useAuthStore } from "@/lib/store";

interface Class {
  _id: string;
  name: string;
  subject: string;
  teacher: {
    _id: string;
    name: string;
    email: string;
  };
  students: number;
  maxStudents: number;
  schedule: {
    day: string;
    time: string;
    duration: number;
  };
  status: "active" | "inactive" | "completed";
  createdAt: string;
  description?: string;
}

export default function ClassesPage() {
  const { user } = useAuthStore();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: "",
    subject: "",
    teacherId: "",
    maxStudents: 30,
    schedule: {
      day: "Monday",
      time: "09:00",
      duration: 60,
    },
    status: "active" as "active" | "inactive",
    description: "",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  // Stats state
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    totalStudents: 0,
    avgClassSize: 0,
  });

  useEffect(() => {
    fetchClasses();
  }, [currentPage, search]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data for now - replace with actual API call
      const mockClasses: Class[] = [
        {
          _id: "1",
          name: "Mathematics 101",
          subject: "Mathematics",
          teacher: { _id: "1", name: "Alice Smith", email: "alice@school.edu" },
          students: 25,
          maxStudents: 30,
          schedule: { day: "Monday", time: "09:00", duration: 60 },
          status: "active",
          createdAt: "2024-01-15",
          description: "Basic mathematics course"
        },
        {
          _id: "2",
          name: "Science 201",
          subject: "Science",
          teacher: { _id: "2", name: "Bob Johnson", email: "bob@school.edu" },
          students: 28,
          maxStudents: 30,
          schedule: { day: "Tuesday", time: "10:00", duration: 90 },
          status: "active",
          createdAt: "2024-01-20",
          description: "Advanced science course"
        },
        {
          _id: "3",
          name: "English 301",
          subject: "English",
          teacher: { _id: "3", name: "Carol Lee", email: "carol@school.edu" },
          students: 22,
          maxStudents: 25,
          schedule: { day: "Wednesday", time: "11:00", duration: 60 },
          status: "active",
          createdAt: "2024-01-25",
          description: "English literature course"
        }
      ];

      setClasses(mockClasses);
      setTotalPages(1);
      
      // Calculate stats
      const totalStudents = mockClasses.reduce((sum, c) => sum + c.students, 0);
      const avgClassSize = totalStudents / mockClasses.length || 0;
      
      setStats({
        total: mockClasses.length,
        active: mockClasses.filter(c => c.status === 'active').length,
        completed: mockClasses.filter(c => c.status === 'completed').length,
        totalStudents,
        avgClassSize: Math.round(avgClassSize * 10) / 10,
      });
    } catch (err: any) {
      setError("Failed to fetch classes");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (classItem: Class) => {
    setSelectedClass(classItem);
    setForm({
      name: classItem.name,
      subject: classItem.subject,
      teacherId: classItem.teacher._id,
      maxStudents: classItem.maxStudents,
      schedule: classItem.schedule,
      status: classItem.status,
      description: classItem.description || "",
    });
    setOpenDialog(true);
  };

  const handleAdd = () => {
    setSelectedClass(null);
    setForm({
      name: "",
      subject: "",
      teacherId: "",
      maxStudents: 30,
      schedule: {
        day: "Monday",
        time: "09:00",
        duration: 60,
      },
      status: "active",
      description: "",
    });
    setOpenDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.subject || !form.teacherId) return;

    try {
      setActionLoading(true);
      setError(null);

      // Mock API call - replace with actual API
      console.log('Saving class:', form);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setOpenDialog(false);
      await fetchClasses();
    } catch (err: any) {
      setError("Failed to save class");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (classItem: Class) => {
    if (!confirm(`Are you sure you want to delete ${classItem.name}?`)) return;

    try {
      setActionLoading(true);
      // Mock API call - replace with actual API
      console.log('Deleting class:', classItem._id);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await fetchClasses();
    } catch (err: any) {
      setError("Failed to delete class");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Class Name', sortable: true },
    { key: 'subject', label: 'Subject', sortable: true },
    { key: 'teacher', label: 'Teacher', sortable: true },
    { key: 'students', label: 'Students', sortable: true },
    { key: 'schedule', label: 'Schedule', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'createdAt', label: 'Created', sortable: true },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Classes"
        description="Manage academic classes and schedules"
        badge={{ text: `${stats.total} classes`, variant: "secondary" }}
        action={{
          label: "Add Class",
          onClick: handleAdd,
          icon: <Plus className="w-4 h-4" />,
        }}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Classes"
          value={stats.total}
          icon={Calendar}
          iconColor="text-blue-500"
          change={{ value: "+2", type: "positive" }}
        />
        <StatsCard
          title="Active Classes"
          value={stats.active}
          icon={UserCheck}
          iconColor="text-green-500"
          change={{ value: "+1", type: "positive" }}
        />
        <StatsCard
          title="Total Students"
          value={stats.totalStudents}
          icon={Users}
          iconColor="text-purple-500"
          change={{ value: "+15", type: "positive" }}
        />
        <StatsCard
          title="Avg Class Size"
          value={stats.avgClassSize}
          icon={TrendingUp}
          iconColor="text-orange-500"
          change={{ value: "+2.1", type: "positive" }}
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
          placeholder="Search classes by name, subject, or teacher..."
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
        data={classes}
        columns={columns}
        loading={loading}
        error={error}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={(classItem) => console.log('View class:', classItem)}
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedClass ? "Edit Class" : "Add New Class"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Class Name</label>
                <Input
                  placeholder="Enter class name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Teacher</label>
                <select
                  value={form.teacherId}
                  onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Select Teacher</option>
                  <option value="1">Alice Smith</option>
                  <option value="2">Bob Johnson</option>
                  <option value="3">Carol Lee</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Max Students</label>
                <Input
                  type="number"
                  placeholder="30"
                  value={form.maxStudents}
                  onChange={(e) => setForm({ ...form, maxStudents: parseInt(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Day</label>
                <select
                  value={form.schedule.day}
                  onChange={(e) => setForm({ 
                    ...form, 
                    schedule: { ...form.schedule, day: e.target.value }
                  })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Time</label>
                <Input
                  type="time"
                  value={form.schedule.time}
                  onChange={(e) => setForm({ 
                    ...form, 
                    schedule: { ...form.schedule, time: e.target.value }
                  })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Duration (min)</label>
                <Input
                  type="number"
                  placeholder="60"
                  value={form.schedule.duration}
                  onChange={(e) => setForm({ 
                    ...form, 
                    schedule: { ...form.schedule, duration: parseInt(e.target.value) }
                  })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                placeholder="Enter class description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full p-2 border rounded-md h-20 resize-none"
              />
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
                    {selectedClass ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  selectedClass ? "Update Class" : "Create Class"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
