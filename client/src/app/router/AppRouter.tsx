import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import AuthGuard from '@/components/auth/AuthGuard'
import RoleGuard from '@/components/auth/RoleGuard'
import LoginPage from '@/pages/LoginPage'
import NotFoundPage from '@/pages/NotFoundPage'
import DashboardLayout from '@/app/layouts/DashboardLayout'

import DashboardHomePage from '@/pages/dashboard/DashboardHomePage'
import OrganizationsPage from '@/pages/dashboard/OrganizationsPage'
import CompaniesPage from '@/pages/dashboard/CompaniesPage'
import UsersPage from '@/pages/dashboard/UsersPage'
import StudentsPage from '@/pages/dashboard/StudentsPage'
import ClassesPage from '@/pages/dashboard/ClassesPage'
import AttendancePage from '@/pages/dashboard/AttendancePage'
import AnnouncementsPage from '@/pages/dashboard/AnnouncementsPage'
import EmployeesPage from '@/pages/dashboard/EmployeesPage'
import HRPage from '@/pages/dashboard/HRPage'
import PayrollPage from '@/pages/dashboard/PayrollPage'
import BillingPage from '@/pages/dashboard/BillingPage'
import ReportsPage from '@/pages/dashboard/ReportsPage'
import InstitutesPage from '@/pages/dashboard/InstitutesPage'
import SettingsPage from '@/pages/dashboard/SettingsPage'
import LeavesPage from '@/pages/dashboard/LeavesPage'
import DepartmentsPage from '@/pages/dashboard/DepartmentsPage'
import AssignmentsPage from '@/pages/dashboard/AssignmentsPage'
import MaterialsPage from '@/pages/dashboard/MaterialsPage'
import OrganizationDetailPage from '@/pages/dashboard/OrganizationDetailPage'
import UserDetailPage from '@/pages/dashboard/UserDetailPage'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />

        <Route element={<AuthGuard />}>
          <Route element={<RoleGuard />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardHomePage />} />
              <Route path="/dashboard/organizations" element={<OrganizationsPage />} />
              <Route path="/dashboard/organizations/:id" element={<OrganizationDetailPage />} />
              <Route path="/dashboard/companies" element={<CompaniesPage />} />
              <Route path="/dashboard/users" element={<UsersPage />} />
              <Route path="/dashboard/users/:id" element={<UserDetailPage />} />
              <Route path="/dashboard/students" element={<StudentsPage />} />
              <Route path="/dashboard/classes" element={<ClassesPage />} />
              <Route path="/dashboard/assignments" element={<AssignmentsPage />} />
              <Route path="/dashboard/materials" element={<MaterialsPage />} />
              <Route path="/dashboard/attendance" element={<AttendancePage />} />
              <Route path="/dashboard/announcements" element={<AnnouncementsPage />} />
              <Route path="/dashboard/employees" element={<EmployeesPage />} />
              <Route path="/dashboard/hr" element={<HRPage />} />
              <Route path="/dashboard/payroll" element={<PayrollPage />} />
              <Route path="/dashboard/billing" element={<BillingPage />} />
              <Route path="/dashboard/reports" element={<ReportsPage />} />
              <Route path="/dashboard/institutes" element={<InstitutesPage />} />
              <Route path="/dashboard/settings" element={<SettingsPage />} />
              <Route path="/dashboard/leaves" element={<LeavesPage />} />
              <Route path="/dashboard/departments" element={<DepartmentsPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
