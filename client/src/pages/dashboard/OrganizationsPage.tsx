import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  CreditCard,
  Edit3,
  ExternalLink,
  FileText,
  GraduationCap,
  Grid2X2,
  Headphones,
  Layers3,
  Mail,
  MapPin,
  Menu,
  MoreHorizontal,
  PackageOpen,
  Phone,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserCog,
  UserPlus,
  Users,
  WalletCards,
  X,
} from "lucide-react";

import { useAppSelector } from "@/app/store";
import {
  useGetOrganizationsQuery,
  useUpdateOrganizationMutation,
} from "@/features/organizations/organizationsApi";
import {
  useGetUsersQuery,
  type OrgUser,
} from "@/features/users/usersApi";

import type { Organization } from "@/features/organizations/types";

type AnyRecord = Record<string, any>;

type DashboardUser = {
  publicId?: string;
  _id?: string;
  userCode?: string;
  name?: string;
  displayName?: string | null;
  email?: string;
  role?: string;
  status?: string;
  instituteId?: string | AnyRecord | null;
  profile?: {
    phone?: string | null;
    avatarUrl?: string | null;
    city?: string | null;
  };
  employment?: AnyRecord;
  academic?: AnyRecord;
  createdAt?: string;
};

type TrendPoint = {
  label: string;
  value: number;
};

type NavItem = {
  label: string;
  path: string;
  icon: any;
};

const ROLE_META: Record<
  string,
  { label: string; icon: any; tone: string; dot: string }
> = {
  admin: {
    label: "Admin",
    icon: ShieldCheck,
    tone: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-900",
  },
  principal: {
    label: "Principal",
    icon: UserCog,
    tone: "bg-indigo-50 text-indigo-700 border-indigo-100",
    dot: "bg-indigo-500",
  },
  teacher: {
    label: "Teacher",
    icon: GraduationCap,
    tone: "bg-emerald-50 text-emerald-700 border-emerald-100",
    dot: "bg-emerald-500",
  },
  student: {
    label: "Student",
    icon: GraduationCap,
    tone: "bg-sky-50 text-sky-700 border-sky-100",
    dot: "bg-sky-500",
  },
  hr: {
    label: "HR",
    icon: UserCog,
    tone: "bg-amber-50 text-amber-700 border-amber-100",
    dot: "bg-amber-500",
  },
  accountant: {
    label: "Accountant",
    icon: CircleDollarSign,
    tone: "bg-violet-50 text-violet-700 border-violet-100",
    dot: "bg-violet-500",
  },
  counselor: {
    label: "Counselor",
    icon: Headphones,
    tone: "bg-rose-50 text-rose-700 border-rose-100",
    dot: "bg-rose-500",
  },
  employee: {
    label: "Employee",
    icon: BriefcaseBusiness,
    tone: "bg-gray-100 text-gray-700 border-gray-200",
    dot: "bg-gray-500",
  },
  support: {
    label: "Support",
    icon: Headphones,
    tone: "bg-orange-50 text-orange-700 border-orange-100",
    dot: "bg-orange-500",
  },
  parent: {
    label: "Parent",
    icon: Users,
    tone: "bg-pink-50 text-pink-700 border-pink-100",
    dot: "bg-pink-500",
  },
};

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", path: "/dashboard", icon: Grid2X2 },
      { label: "Organization", path: "/dashboard/organization", icon: Building2 },
    ],
  },
  {
    title: "People",
    items: [
      { label: "Users", path: "/dashboard/users", icon: Users },
      { label: "Students", path: "/dashboard/students", icon: GraduationCap },
      { label: "Teachers", path: "/dashboard/teachers", icon: UserCheck },
      { label: "Employees", path: "/dashboard/employees", icon: BriefcaseBusiness },
      { label: "HR Operations", path: "/dashboard/hr", icon: UserCog },
    ],
  },
  {
    title: "Academic",
    items: [
      { label: "Classes", path: "/dashboard/classes", icon: Layers3 },
      { label: "Attendance", path: "/dashboard/attendance", icon: ClipboardCheck },
      { label: "Assignments", path: "/dashboard/assignments", icon: FileText },
      { label: "Materials", path: "/dashboard/materials", icon: BookOpen },
    ],
  },
  {
    title: "Communication",
    items: [
      {
        label: "Announcements",
        path: "/dashboard/announcements",
        icon: Bell,
      },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Payroll", path: "/dashboard/payroll", icon: WalletCards },
      { label: "Billing", path: "/dashboard/billing", icon: CreditCard },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Settings", path: "/dashboard/settings", icon: Settings2 },
    ],
  },
];

function rid(value: any) {
  return String(value?.publicId ?? value?._id ?? "");
}

function firstName(value?: string | null) {
  const text = String(value || "").trim();
  if (!text) return "Admin";
  return text.split(/\s+/)[0];
}

function formatDate(value?: string | Date | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatShortDate(value?: string | Date | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

function initials(value?: string | null) {
  const text = String(value || "").trim();
  if (!text) return "U";
  const parts = text.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function titleCase(value?: string | null) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function number(value: any) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function percent(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function safeArray(value: any): any[] {
  return Array.isArray(value) ? value : [];
}

function getUserOrganizationId(user: any) {
  const raw = user?.instituteId;
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  return String(raw?._id ?? raw?.publicId ?? raw ?? "");
}

function getOrganizationLocation(org: AnyRecord) {
  const contact = org?.contact || {};
  return [contact.city, contact.state, contact.country]
    .filter(Boolean)
    .join(", ");
}

function getOrganizationLogo(org: AnyRecord) {
  return (
    org?.branding?.logo ||
    org?.logo ||
    ""
  );
}

function getMaxMembers(org: AnyRecord) {
  return number(org?.settings?.maxMembers || 50);
}

function getRequireApproval(org: AnyRecord) {
  return Boolean(org?.settings?.requireApproval);
}

function getOrganizationPlan(org: AnyRecord) {
  return titleCase(org?.plan || "free");
}

function getOrganizationStatus(org: AnyRecord) {
  return titleCase(org?.status || "active");
}

function roleLabel(role?: string) {
  return ROLE_META[role || ""]?.label || titleCase(role || "User");
}

function roleTone(role?: string) {
  return (
    ROLE_META[role || ""]?.tone ||
    "bg-gray-100 text-gray-700 border-gray-200"
  );
}

function roleIcon(role?: string) {
  return ROLE_META[role || ""]?.icon || Users;
}

function getUserName(user: DashboardUser) {
  return user.displayName || user.name || user.email || "Unknown user";
}

function getDepartmentLabel(user: DashboardUser) {
  const department = user?.employment?.department;
  if (!department) return "Unassigned";
  if (typeof department === "string") return department;
  return (
    department?.name ||
    department?.title ||
    department?.publicId ||
    "Assigned"
  );
}

function buildMonthTrend(users: DashboardUser[]): TrendPoint[] {
  const now = new Date();
  const points: TrendPoint[] = [];
  for (let index = 5; index >= 0; index -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const end = new Date(
      now.getFullYear(),
      now.getMonth() - index + 1,
      1
    );
    const value = users.filter((user) => {
      if (!user.createdAt) return false;
      const date = new Date(user.createdAt);
      return date >= start && date < end;
    }).length;
    points.push({
      label: start.toLocaleDateString("en-IN", {
        month: "short",
      }),
      value,
    });
  }
  return points;
}

function buildRoleCounts(users: DashboardUser[]) {
  const counts: Record<string, number> = {};
  users.forEach((user) => {
    const role = user.role || "unknown";
    counts[role] = (counts[role] || 0) + 1;
  });
  return counts;
}

function buildDepartmentCounts(users: DashboardUser[]) {
  const counts: Record<string, number> = {};
  users.forEach((user) => {
    const department = getDepartmentLabel(user);
    counts[department] = (counts[department] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-gray-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}
    >
      {children}
    </section>
  );
}

function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-gray-950">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-xs leading-5 text-gray-500">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function TinyButton({
  children,
  onClick,
  active = false,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium transition",
        active
          ? "bg-gray-950 text-white"
          : "border border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50",
        disabled ? "cursor-not-allowed opacity-50" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function StatusPill({
  status,
  label,
}: {
  status: "active" | "warning" | "neutral" | "danger";
  label: string;
}) {
  const styles = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-100",
    warning: "bg-amber-50 text-amber-700 border-amber-100",
    neutral: "bg-gray-100 text-gray-600 border-gray-200",
    danger: "bg-rose-50 text-rose-700 border-rose-100",
  };
  const dots = {
    active: "bg-emerald-500",
    warning: "bg-amber-500",
    neutral: "bg-gray-400",
    danger: "bg-rose-500",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-medium ${styles[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dots[status]}`} />
      {label}
    </span>
  );
}

function Avatar({
  user,
  size = "md",
}: {
  user: DashboardUser;
  size?: "sm" | "md" | "lg";
}) {
  const classes = {
    sm: "h-8 w-8 text-[10px]",
    md: "h-10 w-10 text-xs",
    lg: "h-12 w-12 text-sm",
  };
  const url = user?.profile?.avatarUrl;
  return url ? (
    <img
      src={url}
      alt=""
      className={`${classes[size]} rounded-xl object-cover ring-1 ring-gray-200`}
    />
  ) : (
    <div
      className={`${classes[size]} flex items-center justify-center rounded-xl bg-gray-950 font-semibold text-white`}
    >
      {initials(getUserName(user))}
    </div>
  );
}

function Skeleton({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-100 ${className}`}
    />
  );
}

function PageLoading() {
  return (
    <div className="space-y-5 p-5 lg:p-7">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="p-5">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="mt-5 h-3 w-24" />
            <Skeleton className="mt-2 h-7 w-16" />
          </Card>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        <Card className="h-[390px] p-5">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="mt-8 h-64 w-full" />
        </Card>
        <Card className="h-[390px] p-5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-8 h-64 w-full" />
        </Card>
      </div>
    </div>
  );
}

function ErrorState({
  onRetry,
}: {
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <X size={20} />
        </div>
        <h2 className="mt-5 text-lg font-semibold text-gray-950">
          Organization data could not be loaded
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          The dashboard could not retrieve the current organization context.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-gray-950 px-4 text-sm font-medium text-white hover:bg-black"
        >
          <RefreshCw size={15} />
          Retry
        </button>
      </Card>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  text,
}: {
  icon: any;
  title: string;
  text: string;
}) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center px-5 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
        <Icon size={18} />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 max-w-sm text-xs leading-5 text-gray-500">{text}</p>
    </div>
  );
}



function MobileTopbar({
  onMenu,
  organization,
}: {
  onMenu: () => void;
  organization: AnyRecord | null;
}) {
  return (
    <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white/95 px-4 backdrop-blur lg:hidden">
      <button
        type="button"
        onClick={onMenu}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
      >
        <Menu size={19} />
      </button>
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-950 text-[10px] font-black text-white">
          P
        </div>
        <span className="text-sm font-black tracking-[-0.04em]">PAISA</span>
      </div>
      <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gray-950 text-[10px] font-bold text-white">
        {initials(organization?.name)}
      </div>
    </div>
  );
}

function MobileMenu({
  open,
  onClose,
  currentPath,
}: {
  open: boolean;
  onClose: () => void;
  currentPath: string;
}) {
  const navigate = useNavigate();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 bg-gray-950/30 backdrop-blur-[2px]"
      />
      <div className="absolute inset-y-0 left-0 w-[290px] bg-white shadow-2xl">
        <div className="flex h-14 items-center justify-between border-b border-gray-100 px-4">
          <span className="text-sm font-black tracking-[-0.03em]">PAISA</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
          >
            <X size={17} />
          </button>
        </div>
        <div className="h-[calc(100vh-56px)] overflow-y-auto p-3">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="mb-5">
              <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
                {group.title}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active =
                    currentPath === item.path ||
                    (item.path !== "/dashboard" &&
                      currentPath.startsWith(`${item.path}/`));
                  return (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate(item.path);
                      }}
                      className={[
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm",
                        active
                          ? "bg-gray-950 font-medium text-white"
                          : "text-gray-600 hover:bg-gray-50",
                      ].join(" ")}
                    >
                      <Icon size={16} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Topbar({
  organization,
  currentUser,
  onRefresh,
  refreshing,
  onEdit,
}: {
  organization: AnyRecord | null;
  currentUser: AnyRecord | null;
  onRefresh: () => void;
  refreshing: boolean;
  onEdit: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 hidden h-16 items-center justify-between border-b border-gray-200 bg-white/95 px-5 backdrop-blur lg:flex xl:px-7">
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-400">
          {titleCase(organization?.type || "Organization")} workspace
        </p>
        <p className="truncate text-sm font-semibold text-gray-950">
          {organization?.name || "Organization"}
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onRefresh}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900"
          title="Refresh dashboard"
        >
          <RefreshCw
            size={15}
            className={refreshing ? "animate-spin" : ""}
          />
        </button>

        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900"
        >
          <Bell size={16} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-gray-950" />
        </button>

        <div className="ml-1 flex items-center gap-2.5 border-l border-gray-200 pl-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-950 text-[10px] font-bold text-white">
            {initials(currentUser?.name || currentUser?.email)}
          </div>
          <div className="hidden min-w-0 xl:block">
            <p className="max-w-[150px] truncate text-xs font-semibold text-gray-900">
              {currentUser?.name || "Admin"}
            </p>
            <p className="text-[10px] text-gray-500">Admin</p>
          </div>
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            title="Edit organization"
          >
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}

function PageHeader({
  organization,
  onEdit,
  onAddUser,
}: {
  organization: AnyRecord;
  onEdit: () => void;
  onAddUser: () => void;
}) {
  const navigate = useNavigate();
  const location = getOrganizationLocation(organization);

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="px-4 py-5 sm:px-6 lg:px-7 lg:py-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <StatusPill
                status={
                  organization?.status === "active"
                    ? "active"
                    : organization?.status === "suspended"
                    ? "danger"
                    : "warning"
                }
                label={getOrganizationStatus(organization)}
              />
              <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-600">
                {titleCase(organization?.type || "organization")}
              </span>
              <span className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-600">
                {getOrganizationPlan(organization)} plan
              </span>
            </div>

            <div className="flex items-start gap-4">
              <div className="hidden h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gray-950 text-lg font-bold text-white shadow-sm sm:flex">
                {getOrganizationLogo(organization) ? (
                  <img
                    src={getOrganizationLogo(organization)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials(organization?.name)
                )}
              </div>
              <div className="min-w-0">
                <h1 className="text-[27px] font-semibold tracking-[-0.04em] text-gray-950 sm:text-3xl">
                  {organization?.name || "Organization"}
                </h1>
                <p className="mt-1.5 max-w-3xl text-sm leading-6 text-gray-500">
                  Manage your organization, people, academic operations,
                  communication, and account settings from one workspace.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
                  {location ? (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={13} />
                      {location}
                    </span>
                  ) : null}
                  {organization?.contact?.email ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Mail size={13} />
                      {organization.contact.email}
                    </span>
                  ) : null}
                  {organization?.createdAt ? (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays size={13} />
                      Since {formatDate(organization.createdAt)}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/dashboard/settings")}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Settings2 size={15} />
              Settings
            </button>
            <button
              type="button"
              onClick={onAddUser}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-gray-950 px-4 text-sm font-medium text-white shadow-sm hover:bg-black"
            >
              <UserPlus size={15} />
              Add user
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Edit3 size={15} />
              Edit organization
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sublabel,
  trend,
  onClick,
}: {
  icon: any;
  label: string;
  value: string | number;
  sublabel: string;
  trend?: { value: string; positive?: boolean };
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-2xl border border-gray-200/80 bg-white p-5 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-[1px] hover:border-gray-300 hover:shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-950 text-white">
          <Icon size={17} />
        </div>
        {trend ? (
          <span
            className={[
              "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold",
              trend.positive === false
                ? "bg-rose-50 text-rose-700"
                : "bg-emerald-50 text-emerald-700",
            ].join(" ")}
          >
            {trend.positive === false ? (
              <ArrowDownRight size={11} />
            ) : (
              <ArrowUpRight size={11} />
            )}
            {trend.value}
          </span>
        ) : null}
      </div>
      <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">
        {label}
      </p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="text-[28px] font-semibold tracking-[-0.04em] text-gray-950">
          {value}
        </p>
        <span className="mb-1 text-[11px] font-medium text-gray-400">
          {sublabel}
        </span>
      </div>
    </button>
  );
}

function TrendChart({
  points,
}: {
  points: TrendPoint[];
}) {
  const max = Math.max(1, ...points.map((point) => point.value));
  const width = 760;
  const height = 230;
  const paddingX = 34;
  const paddingY = 24;
  const usableWidth = width - paddingX * 2;
  const usableHeight = height - paddingY * 2;

  const coords = points.map((point, index) => {
    const x =
      paddingX +
      (index / Math.max(1, points.length - 1)) * usableWidth;
    const y =
      height -
      paddingY -
      (point.value / max) * usableHeight;
    return { x, y, ...point };
  });

  const path = coords
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const area = `${path} L ${coords[coords.length - 1]?.x || width - paddingX} ${
    height - paddingY
  } L ${coords[0]?.x || paddingX} ${height - paddingY} Z`;

  return (
    <div className="px-5 pb-5 pt-3">
      <div className="h-[260px] w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-full w-full"
          preserveAspectRatio="none"
        >
          {[0, 1, 2, 3].map((line) => {
            const y =
              paddingY +
              (line / 3) * usableHeight;
            return (
              <line
                key={line}
                x1={paddingX}
                x2={width - paddingX}
                y1={y}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            );
          })}

          <path
            d={area}
            fill="#f3f4f6"
            opacity="0.7"
          />

          <path
            d={path}
            fill="none"
            stroke="#111827"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {coords.map((point) => (
            <g key={`${point.label}-${point.x}`}>
              <circle
                cx={point.x}
                cy={point.y}
                r="5"
                fill="white"
                stroke="#111827"
                strokeWidth="3"
              />
            </g>
          ))}
        </svg>
      </div>

      <div className="grid grid-cols-6 gap-2 px-3">
        {points.map((point) => (
          <div key={point.label} className="text-center">
            <p className="text-[10px] font-medium text-gray-400">
              {point.label}
            </p>
            <p className="mt-1 text-xs font-semibold text-gray-900">
              {point.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoleMixChart({
  counts,
  total,
}: {
  counts: Record<string, number>;
  total: number;
}) {
  const items = Object.entries(counts)
    .filter(([role]) => role !== "super_admin")
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  if (!items.length) {
    return (
      <EmptyState
        icon={Users}
        title="No people yet"
        text="People distribution will appear here after users are added."
      />
    );
  }

  return (
    <div className="p-5">
      <div className="space-y-4">
        {items.map(([role, value]) => {
          const Icon = roleIcon(role);
          const ratio = percent(value, total);
          return (
            <div key={role}>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <div
                    className={[
                      "flex h-7 w-7 items-center justify-center rounded-lg border",
                      roleTone(role),
                    ].join(" ")}
                  >
                    <Icon size={13} />
                  </div>
                  <span className="truncate text-xs font-medium text-gray-700">
                    {roleLabel(role)}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs font-semibold text-gray-900">
                    {value}
                  </span>
                  <span className="w-8 text-right text-[10px] text-gray-400">
                    {ratio}%
                  </span>
                </div>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-gray-950 transition-all"
                  style={{ width: `${Math.max(2, ratio)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DepartmentChart({
  departments,
}: {
  departments: { name: string; value: number }[];
}) {
  if (!departments.length) {
    return (
      <EmptyState
        icon={Layers3}
        title="No department data"
        text="Create departments and assign people to them to see the organization structure here."
      />
    );
  }

  const max = Math.max(...departments.map((item) => item.value), 1);

  return (
    <div className="space-y-4 p-5">
      {departments.map((department) => (
        <div key={department.name}>
          <div className="mb-1.5 flex items-center justify-between gap-4">
            <span className="truncate text-xs font-medium text-gray-700">
              {department.name}
            </span>
            <span className="text-xs font-semibold text-gray-900">
              {department.value}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gray-800"
              style={{
                width: `${Math.max(4, (department.value / max) * 100)}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function RecentPeople({
  users,
  onViewAll,
}: {
  users: DashboardUser[];
  onViewAll: () => void;
}) {
  const recent = [...users]
    .sort((a, b) => {
      const ad = new Date(a.createdAt || 0).getTime();
      const bd = new Date(b.createdAt || 0).getTime();
      return bd - ad;
    })
    .slice(0, 6);

  return (
    <Card>
      <CardHeader
        title="Recently added"
        subtitle="Latest people added to this organization"
        action={
          <TinyButton onClick={onViewAll}>
            View all <ChevronRight size={13} />
          </TinyButton>
        }
      />
      {recent.length ? (
        <div className="divide-y divide-gray-100">
          {recent.map((user) => (
            <div
              key={rid(user) || `${user.email}-${user.createdAt}`}
              className="flex items-center gap-3 px-5 py-3.5"
            >
              <Avatar user={user} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-gray-900">
                  {getUserName(user)}
                </p>
                <p className="mt-0.5 truncate text-[10px] text-gray-500">
                  {user.email || "No email"} · {roleLabel(user.role)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-medium text-gray-400">
                  {formatShortDate(user.createdAt)}
                </p>
                <div className="mt-1">
                  <StatusPill
                    status={
                      user.status === "active"
                        ? "active"
                        : user.status === "suspended"
                        ? "danger"
                        : "neutral"
                    }
                    label={titleCase(user.status || "unknown")}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No members"
          text="Start by adding teachers, students, employees, or other users."
        />
      )}
    </Card>
  );
}

function OrganizationHealth({
  organization,
  totalUsers,
  activeUsers,
}: {
  organization: AnyRecord;
  totalUsers: number;
  activeUsers: number;
}) {
  const maxMembers = getMaxMembers(organization);
  const usage = Math.min(100, percent(totalUsers, maxMembers));
  const activeRate = percent(activeUsers, totalUsers);

  const rows = [
    {
      label: "Member capacity",
      value: `${totalUsers} / ${maxMembers}`,
      percent: usage,
      status:
        usage >= 90 ? "danger" : usage >= 75 ? "warning" : "active",
    },
    {
      label: "Active accounts",
      value: `${activeUsers} / ${totalUsers}`,
      percent: activeRate,
      status:
        activeRate >= 90 ? "active" : activeRate >= 70 ? "warning" : "danger",
    },
    {
      label: "Organization status",
      value: getOrganizationStatus(organization),
      percent: organization?.status === "active" ? 100 : 35,
      status:
        organization?.status === "active" ? "active" : "danger",
    },
  ] as const;

  return (
    <Card>
      <CardHeader
        title="Organization health"
        subtitle="Capacity and account status at a glance"
      />
      <div className="space-y-5 p-5">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-gray-600">
                {row.label}
              </span>
              <span className="text-xs font-semibold text-gray-900">
                {row.value}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className={[
                  "h-full rounded-full",
                  row.status === "active"
                    ? "bg-emerald-500"
                    : row.status === "warning"
                    ? "bg-amber-500"
                    : "bg-rose-500",
                ].join(" ")}
                style={{ width: `${Math.max(4, row.percent)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function QuickActions({
  organization,
}: {
  organization: AnyRecord;
}) {
  const navigate = useNavigate();

  const actions = [
    {
      label: "Add user",
      description: "Create a new organization member",
      icon: UserPlus,
      path: "/dashboard/users",
    },
    {
      label: "Manage students",
      description: "Review learners and profiles",
      icon: GraduationCap,
      path: "/dashboard/students",
    },
    {
      label: "Manage teachers",
      description: "Teaching staff and assignments",
      icon: UserCheck,
      path: "/dashboard/teachers",
    },
    {
      label: "Create class",
      description: "Set up classes and schedules",
      icon: Layers3,
      path: "/dashboard/classes",
    },
    {
      label: "Departments",
      description: "Build your organization structure",
      icon: Building2,
      path: "/dashboard/hr",
    },
    {
      label: "Send announcement",
      description: "Publish a message to your people",
      icon: Bell,
      path: "/dashboard/announcements",
    },
  ];

  return (
    <Card>
      <CardHeader
        title="Quick actions"
        subtitle={`Common tasks for ${organization?.name || "your organization"}`}
      />
      <div className="grid gap-2 p-3 sm:grid-cols-2 xl:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              type="button"
              onClick={() => navigate(action.path)}
              className="group rounded-xl border border-transparent p-3 text-left transition hover:border-gray-200 hover:bg-gray-50"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700 transition group-hover:bg-gray-950 group-hover:text-white">
                  <Icon size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-900">
                    {action.label}
                  </p>
                  <p className="mt-1 text-[10px] leading-4 text-gray-500">
                    {action.description}
                  </p>
                </div>
                <ChevronRight
                  size={14}
                  className="ml-auto mt-1 shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-gray-600"
                />
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function OrganizationDetails({
  organization,
}: {
  organization: AnyRecord;
}) {
  const location = getOrganizationLocation(organization);

  const rows = [
    ["Organization code", organization?.orgCode || "—"],
    ["Organization type", titleCase(organization?.type || "—")],
    ["Plan", getOrganizationPlan(organization)],
    ["Maximum members", String(getMaxMembers(organization))],
    [
      "Member approval",
      getRequireApproval(organization) ? "Required" : "Not required",
    ],
    ["Created", formatDate(organization?.createdAt)],
  ];

  return (
    <Card>
      <CardHeader
        title="Organization details"
        subtitle="Core identity and operating configuration"
      />
      <div className="grid gap-px bg-gray-100 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="bg-white px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
              {label}
            </p>
            <p className="mt-1.5 break-words text-sm font-medium text-gray-900">
              {value}
            </p>
          </div>
        ))}
      </div>
      {organization?.description ? (
        <div className="border-t border-gray-100 px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
            Description
          </p>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            {organization.description}
          </p>
        </div>
      ) : null}
      {location ? (
        <div className="border-t border-gray-100 px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
            Location
          </p>
          <p className="mt-2 flex items-center gap-2 text-sm text-gray-700">
            <MapPin size={14} className="text-gray-400" />
            {location}
          </p>
        </div>
      ) : null}
    </Card>
  );
}

function ContactCard({
  organization,
}: {
  organization: AnyRecord;
}) {
  const contact = organization?.contact || {};
  const website =
    organization?.website ||
    organization?.branding?.website ||
    null;

  return (
    <Card>
      <CardHeader
        title="Contact"
        subtitle="Organization contact information"
      />
      <div className="space-y-4 p-5">
        <ContactRow
          icon={Mail}
          label="Email"
          value={contact.email || "Not provided"}
        />
        <ContactRow
          icon={Phone}
          label="Phone"
          value={contact.phone || "Not provided"}
        />
        <ContactRow
          icon={MapPin}
          label="Address"
          value={
            [
              contact.address,
              contact.city,
              contact.state,
              contact.country,
              contact.pincode,
            ]
              .filter(Boolean)
              .join(", ") || "Not provided"
          }
        />
        {website ? (
          <a
            href={website}
            target="_blank"
            rel="noreferrer"
            className="flex items-start gap-3 rounded-xl border border-gray-100 p-3 transition hover:bg-gray-50"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
              <ExternalLink size={14} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400">
                Website
              </p>
              <p className="mt-1 truncate text-xs font-medium text-gray-800">
                {website}
              </p>
            </div>
          </a>
        ) : null}
      </div>
    </Card>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
        <Icon size={14} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400">
          {label}
        </p>
        <p className="mt-1 break-words text-xs font-medium leading-5 text-gray-800">
          {value}
        </p>
      </div>
    </div>
  );
}

function PlanCard({
  organization,
}: {
  organization: AnyRecord;
}) {
  const maxMembers = getMaxMembers(organization);

  return (
    <Card className="overflow-hidden">
      <div className="bg-gray-950 p-5 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-400">
              Subscription
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
              {getOrganizationPlan(organization)}
            </p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
            <CreditCard size={16} />
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
          <div>
            <p className="text-[10px] text-gray-500">Status</p>
            <p className="mt-1 text-xs font-medium text-white">
              {getOrganizationStatus(organization)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500">Currency</p>
            <p className="mt-1 text-xs font-medium text-white">
              {organization?.billing?.currency || "INR"}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500">Member limit</p>
            <p className="mt-1 text-xs font-medium text-white">
              {maxMembers}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500">Approval</p>
            <p className="mt-1 text-xs font-medium text-white">
              {getRequireApproval(organization) ? "Required" : "Open"}
            </p>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-100 p-4">
        <button
          type="button"
          onClick={() => {
            window.location.assign("/dashboard/billing");
          }}
          className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          Manage billing
          <ChevronRight size={14} />
        </button>
      </div>
    </Card>
  );
}

function SecurityCard({
  organization,
}: {
  organization: AnyRecord;
}) {
  const checks = [
    {
      label: "Organization is active",
      ok: organization?.status === "active",
    },
    {
      label: "Member approval policy configured",
      ok: typeof organization?.settings?.requireApproval === "boolean",
    },
    {
      label: "Member capacity configured",
      ok: Boolean(organization?.settings?.maxMembers),
    },
    {
      label: "Contact email configured",
      ok: Boolean(organization?.contact?.email),
    },
  ];

  return (
    <Card>
      <CardHeader
        title="Workspace controls"
        subtitle="Operational safeguards for your organization"
      />
      <div className="divide-y divide-gray-100">
        {checks.map((check) => (
          <div
            key={check.label}
            className="flex items-center gap-3 px-5 py-3.5"
          >
            <div
              className={[
                "flex h-7 w-7 items-center justify-center rounded-lg",
                check.ok
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-amber-50 text-amber-600",
              ].join(" ")}
            >
              {check.ok ? <Check size={14} /> : <Clock3 size={14} />}
            </div>
            <span className="flex-1 text-xs font-medium text-gray-700">
              {check.label}
            </span>
            <span
              className={[
                "text-[10px] font-semibold",
                check.ok ? "text-emerald-600" : "text-amber-600",
              ].join(" ")}
            >
              {check.ok ? "Configured" : "Review"}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ActivityCard({
  users,
}: {
  users: DashboardUser[];
}) {
  const events = [...users]
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    )
    .slice(0, 5);

  return (
    <Card>
      <CardHeader
        title="Activity"
        subtitle="Recent organization events"
      />
      {events.length ? (
        <div className="divide-y divide-gray-100">
          {events.map((user) => (
            <div
              key={`activity-${rid(user) || user.email}`}
              className="flex gap-3 px-5 py-4"
            >
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                <UserPlus size={13} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs leading-5 text-gray-700">
                  <span className="font-semibold text-gray-900">
                    {getUserName(user)}
                  </span>{" "}
                  was added as{" "}
                  <span className="font-medium">
                    {roleLabel(user.role)}
                  </span>
                  .
                </p>
                <p className="mt-1 text-[10px] text-gray-400">
                  {formatDate(user.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Activity}
          title="No activity yet"
          text="Recent organization activity will appear here."
        />
      )}
    </Card>
  );
}

function FeatureGrid({
  organization,
}: {
  organization: AnyRecord;
}) {
  const features = [
    {
      label: "People",
      description: "Users and role management",
      icon: Users,
      enabled: true,
      path: "/dashboard/users",
    },
    {
      label: "Academic",
      description: "Classes and learning workflows",
      icon: GraduationCap,
      enabled: ["school", "college", "coaching", "institute", "others"].includes(
        organization?.type
      ),
      path: "/dashboard/classes",
    },
    {
      label: "Attendance",
      description: "Track daily presence",
      icon: ClipboardCheck,
      enabled: true,
      path: "/dashboard/attendance",
    },
    {
      label: "HR",
      description: "Employees and departments",
      icon: BriefcaseBusiness,
      enabled: true,
      path: "/dashboard/hr",
    },
    {
      label: "Payroll",
      description: "Salary and payslip operations",
      icon: WalletCards,
      enabled: true,
      path: "/dashboard/payroll",
    },
    {
      label: "Communication",
      description: "Announcements and notices",
      icon: Bell,
      enabled: true,
      path: "/dashboard/announcements",
    },
    {
      label: "Materials",
      description: "Study resources and files",
      icon: BookOpen,
      enabled: true,
      path: "/dashboard/materials",
    },
    {
      label: "Billing",
      description: "Plan and subscription",
      icon: CreditCard,
      enabled: true,
      path: "/dashboard/billing",
    },
  ];

  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader
        title="Workspace modules"
        subtitle="Jump directly into the parts of Paisa your organization uses"
      />
      <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <button
              type="button"
              key={feature.label}
              disabled={!feature.enabled}
              onClick={() => navigate(feature.path)}
              className={[
                "group rounded-2xl border p-4 text-left transition",
                feature.enabled
                  ? "border-gray-200 bg-white hover:-translate-y-0.5 hover:border-gray-300 hover:bg-gray-50"
                  : "cursor-not-allowed border-gray-100 bg-gray-50 opacity-50",
              ].join(" ")}
            >
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-600 group-hover:bg-gray-950 group-hover:text-white">
                  <Icon size={15} />
                </div>
                <span
                  className={[
                    "h-2 w-2 rounded-full",
                    feature.enabled ? "bg-emerald-500" : "bg-gray-300",
                  ].join(" ")}
                />
              </div>
              <p className="mt-4 text-xs font-semibold text-gray-900">
                {feature.label}
              </p>
              <p className="mt-1 text-[10px] leading-4 text-gray-500">
                {feature.description}
              </p>
              <p className="mt-3 text-[10px] font-medium text-gray-400">
                {feature.enabled ? "Available" : "Not available"}
              </p>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function OrganizationCodeCard({
  organization,
}: {
  organization: AnyRecord;
}) {
  return (
    <Card>
      <CardHeader
        title="Organization identity"
        subtitle="Internal identifiers used across the workspace"
      />
      <div className="space-y-4 p-5">
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
            Organization code
          </p>
          <p className="mt-1.5 font-mono text-sm font-semibold text-gray-900">
            {organization?.orgCode || "—"}
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
            Created
          </p>
          <p className="mt-1.5 text-sm font-semibold text-gray-900">
            {formatDate(organization?.createdAt)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
            Public reference
          </p>
          <p className="mt-1.5 break-all font-mono text-xs font-medium text-gray-700">
            {organization?.publicId || "—"}
          </p>
        </div>
      </div>
    </Card>
  );
}

function EditOrganizationModal({
  open,
  organization,
  onClose,
  onSaved,
}: {
  open: boolean;
  organization: AnyRecord | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [updateOrganization, updateState] =
    useUpdateOrganizationMutation();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [maxMembers, setMaxMembers] = useState(50);
  const [requireApproval, setRequireApproval] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !organization) return;
    setName(organization.name || "");
    setDescription(organization.description || "");
    setWebsite(
      organization.website ||
        organization.branding?.website ||
        ""
    );
    setEmail(organization.contact?.email || "");
    setPhone(organization.contact?.phone || "");
    setAddress(organization.contact?.address || "");
    setCity(organization.contact?.city || "");
    setState(organization.contact?.state || "");
    setPincode(organization.contact?.pincode || "");
    setMaxMembers(getMaxMembers(organization));
    setRequireApproval(getRequireApproval(organization));
    setError("");
  }, [open, organization]);

  if (!open || !organization) return null;

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    try {
      await updateOrganization({
        id: rid(organization),
        payload: {
          description,
          website,
          contact: {
            email,
            phone,
            address,
            city,
            state,
            country: organization?.contact?.country || "India",
            pincode,
          },
          settings: {
            ...(organization?.settings || {}),
            maxMembers,
            requireApproval,
          },
        },
      } as any).unwrap();

      onSaved();
      onClose();
    } catch (err: any) {
      setError(
        err?.data?.message ||
          err?.message ||
          "Unable to update organization"
      );
    }
  };

  const input =
    "mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-950 focus:ring-2 focus:ring-gray-950/5";

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-gray-950/40 p-0 backdrop-blur-sm sm:items-center sm:p-5">
      <div className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-400">
              Organization settings
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-gray-950">
              Edit {organization.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={save}
          className="min-h-0 flex-1 overflow-y-auto p-5"
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700">
                  Organization name
                </label>
                <input
                  value={name}
                  disabled
                  className={`${input} cursor-not-allowed bg-gray-50 text-gray-400`}
                />
                <p className="mt-1 text-[10px] text-gray-400">
                  Organization name is managed by the platform.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  rows={4}
                  className={input}
                  placeholder="Describe your organization"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">
                  Website
                </label>
                <input
                  value={website}
                  onChange={(event) =>
                    setWebsite(event.target.value)
                  }
                  className={input}
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">
                  Maximum members
                </label>
                <input
                  type="number"
                  min={1}
                  value={maxMembers}
                  onChange={(event) =>
                    setMaxMembers(
                      Math.max(
                        1,
                        Number(event.target.value) || 1
                      )
                    )
                  }
                  className={input}
                />
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-3">
                <input
                  type="checkbox"
                  checked={requireApproval}
                  onChange={(event) =>
                    setRequireApproval(event.target.checked)
                  }
                  className="mt-0.5 h-4 w-4 rounded border-gray-300"
                />
                <span>
                  <span className="block text-xs font-semibold text-gray-900">
                    Require member approval
                  </span>
                  <span className="mt-1 block text-[10px] leading-4 text-gray-500">
                    New members require organization approval before
                    joining.
                  </span>
                </span>
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700">
                  Contact email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  className={input}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">
                  Phone
                </label>
                <input
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  className={input}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">
                  Address
                </label>
                <input
                  value={address}
                  onChange={(event) =>
                    setAddress(event.target.value)
                  }
                  className={input}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700">
                    City
                  </label>
                  <input
                    value={city}
                    onChange={(event) =>
                      setCity(event.target.value)
                    }
                    className={input}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">
                    State
                  </label>
                  <input
                    value={state}
                    onChange={(event) =>
                      setState(event.target.value)
                    }
                    className={input}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">
                  Pincode
                </label>
                <input
                  value={pincode}
                  onChange={(event) =>
                    setPincode(event.target.value)
                  }
                  className={input}
                />
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                  Organization code
                </p>
                <p className="mt-1.5 font-mono text-sm font-semibold text-gray-900">
                  {organization.orgCode || "—"}
                </p>
                <p className="mt-3 text-[10px] leading-4 text-gray-500">
                  Public IDs are used for application URLs and resource
                  operations. They are not editable.
                </p>
              </div>
            </div>
          </div>

          {error ? (
            <div className="mt-5 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="mt-6 flex justify-end gap-2 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateState.isLoading}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-gray-950 px-5 text-sm font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updateState.isLoading ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Check size={14} />
              )}
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PublicIdNotice() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
        <ShieldCheck size={14} />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-900">
          Identity-safe URLs
        </p>
        <p className="mt-1 text-[10px] leading-4 text-gray-500">
          Resource URLs and mutations should use publicId rather than
          exposing MongoDB ObjectIds.
        </p>
      </div>
    </div>
  );
}

function SearchPeopleBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <Search
        size={15}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
      />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search people, email, code..."
        className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-xs text-gray-900 outline-none placeholder:text-gray-400 focus:border-gray-950"
      />
    </div>
  );
}

function PeoplePreview({
  users,
  search,
  onSearchChange,
  onViewAll,
}: {
  users: DashboardUser[];
  search: string;
  onSearchChange: (value: string) => void;
  onViewAll: () => void;
}) {
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users.slice(0, 5);
    return users
      .filter((user) => {
        return [
          getUserName(user),
          user.email,
          user.userCode,
          roleLabel(user.role),
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(query)
          );
      })
      .slice(0, 5);
  }, [users, search]);

  return (
    <Card>
      <CardHeader
        title="People directory"
        subtitle="A quick view of the organization member base"
        action={
          <TinyButton onClick={onViewAll}>
            Manage users <ChevronRight size={13} />
          </TinyButton>
        }
      />
      <div className="border-b border-gray-100 p-4">
        <SearchPeopleBar
          value={search}
          onChange={onSearchChange}
        />
      </div>
      {filtered.length ? (
        <div className="divide-y divide-gray-100">
          {filtered.map((user) => {
            const Icon = roleIcon(user.role);
            return (
              <div
                key={rid(user) || `${user.email}-${user.role}`}
                className="flex items-center gap-3 px-5 py-3.5"
              >
                <Avatar user={user} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="truncate text-xs font-semibold text-gray-900">
                      {getUserName(user)}
                    </p>
                    <span
                      className={[
                        "hidden shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-medium sm:inline-flex",
                        roleTone(user.role),
                      ].join(" ")}
                    >
                      <Icon size={9} />
                      {roleLabel(user.role)}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[10px] text-gray-500">
                    {user.email || user.userCode || "No contact details"}
                  </p>
                </div>
                <StatusPill
                  status={
                    user.status === "active"
                      ? "active"
                      : user.status === "suspended"
                      ? "danger"
                      : "neutral"
                  }
                  label={titleCase(user.status || "unknown")}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Search}
          title="No matching people"
          text="Try another search term."
        />
      )}
    </Card>
  );
}

function AdminWelcomeStrip({
  organization,
  currentUser,
}: {
  organization: AnyRecord;
  currentUser: AnyRecord;
}) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-950 p-5 text-white shadow-[0_12px_40px_rgba(15,23,42,0.12)] sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 sm:flex">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
              Organization command center
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] sm:text-2xl">
              {greeting}, {firstName(currentUser?.name)}.
            </h2>
            <p className="mt-1.5 max-w-2xl text-xs leading-5 text-gray-400">
              Here is the current operating picture for{" "}
              <span className="font-medium text-gray-200">
                {organization?.name || "your organization"}
              </span>
              .
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <div className="rounded-xl bg-white/5 px-4 py-3">
            <p className="text-[9px] uppercase tracking-[0.14em] text-gray-500">
              Plan
            </p>
            <p className="mt-1 text-sm font-semibold">
              {getOrganizationPlan(organization)}
            </p>
          </div>
          <div className="rounded-xl bg-white/5 px-4 py-3">
            <p className="text-[9px] uppercase tracking-[0.14em] text-gray-500">
              Status
            </p>
            <p className="mt-1 text-sm font-semibold">
              {getOrganizationStatus(organization)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrganizationDashboard() {
  const navigate = useNavigate();
  const currentUser = useAppSelector(
    (state: any) => state.auth.user
  ) as AnyRecord | null;

  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [peopleSearch, setPeopleSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const currentPath =
    typeof window !== "undefined"
      ? window.location.pathname
      : "/dashboard/organization";

  const organizationId = getUserOrganizationId(currentUser);

  const organizationsQuery = useGetOrganizationsQuery({
    page: 1,
    limit: 10,
  });

  const usersQuery = useGetUsersQuery({
    limit: 1000,
  } as any);

  const organizations = safeArray(
    (organizationsQuery.data as any)?.data ||
      organizationsQuery.data ||
      []
  ) as AnyRecord[];

  const users = safeArray(
    (usersQuery.data as any)?.data ||
      usersQuery.data ||
      []
  ) as DashboardUser[];

  const organization = useMemo(() => {
    if (!organizations.length) return null;

    const byPublicId = organizations.find(
      (item) =>
        organizationId &&
        String(item?.publicId) === String(organizationId)
    );
    if (byPublicId) return byPublicId;

    const byId = organizations.find(
      (item) =>
        organizationId &&
        String(item?._id) === String(organizationId)
    );
    if (byId) return byId;

    return organizations[0] || null;
  }, [organizations, organizationId]);

  const scopedUsers = useMemo(() => {
    if (!organization) return users;

    const orgId = String(
      organization?._id ||
        organization?.publicId ||
        organizationId
    );

    return users.filter((user) => {
      const userOrg =
        typeof user.instituteId === "string"
          ? user.instituteId
          : String(
              (user.instituteId as AnyRecord)?._id ||
                (user.instituteId as AnyRecord)?.publicId ||
                ""
            );

      return !userOrg || userOrg === orgId || userOrg === organizationId;
    });
  }, [users, organization, organizationId]);

  const roleCounts = useMemo(
    () => buildRoleCounts(scopedUsers),
    [scopedUsers]
  );

  const departmentCounts = useMemo(
    () => buildDepartmentCounts(scopedUsers),
    [scopedUsers]
  );

  const trend = useMemo(
    () => buildMonthTrend(scopedUsers),
    [scopedUsers]
  );

  const totalUsers = scopedUsers.length;
  const activeUsers = scopedUsers.filter(
    (user) => user.status === "active"
  ).length;

  const students = number(roleCounts.student);
  const teachers = number(roleCounts.teacher);
  const employees = number(roleCounts.employee);
  const admins = number(roleCounts.admin);
  const hrUsers = number(roleCounts.hr);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        organizationsQuery.refetch(),
        usersQuery.refetch(),
      ]);
    } finally {
      window.setTimeout(() => setRefreshing(false), 400);
    }
  };

  if (
    organizationsQuery.isLoading &&
    !organizations.length
  ) {
    return <PageLoading />;
  }

  if (
    organizationsQuery.isError ||
    usersQuery.isError
  ) {
    return (
      <ErrorState
        onRetry={() => {
          void refresh();
        }}
      />
    );
  }

  if (!organization) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <Card className="max-w-md p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
            <Building2 size={20} />
          </div>
          <h1 className="mt-5 text-lg font-semibold text-gray-950">
            No organization found
          </h1>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Your admin account is not currently associated with an
            organization.
          </p>
          <button
            type="button"
            onClick={() => navigate("/dashboard/settings")}
            className="mt-6 h-10 rounded-xl bg-gray-950 px-4 text-sm font-medium text-white"
          >
            Open settings
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-gray-950">
      <div className="flex min-h-screen">


        <div className="min-w-0 flex-1">
          <MobileTopbar
            onMenu={() => setMobileMenu(true)}
            organization={organization}
          />

          <Topbar
            organization={organization}
            currentUser={currentUser}
            onRefresh={() => {
              void refresh();
            }}
            refreshing={refreshing}
            onEdit={() => setEditOpen(true)}
          />

          <main className="min-w-0">
            <PageHeader
              organization={organization}
              onEdit={() => setEditOpen(true)}
              onAddUser={() => navigate("/dashboard/users")}
            />

            <div className="space-y-5 px-4 py-5 sm:px-6 lg:px-7 lg:py-6">
              <AdminWelcomeStrip
                organization={organization}
                currentUser={currentUser || {}}
              />

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  icon={Users}
                  label="Total members"
                  value={totalUsers}
                  sublabel={`of ${getMaxMembers(organization)}`}
                  trend={{
                    value: `${percent(
                      activeUsers,
                      Math.max(1, totalUsers)
                    )}% active`,
                  }}
                  onClick={() => navigate("/dashboard/users")}
                />

                <MetricCard
                  icon={GraduationCap}
                  label="Students"
                  value={students}
                  sublabel={`${percent(
                    students,
                    Math.max(1, totalUsers)
                  )}% of people`}
                  onClick={() => navigate("/dashboard/students")}
                />

                <MetricCard
                  icon={UserCheck}
                  label="Teachers"
                  value={teachers}
                  sublabel={`${percent(
                    teachers,
                    Math.max(1, totalUsers)
                  )}% of people`}
                  onClick={() => navigate("/dashboard/teachers")}
                />

                <MetricCard
                  icon={BriefcaseBusiness}
                  label="Staff & admin"
                  value={employees + admins + hrUsers}
                  sublabel="Operational team"
                  onClick={() => navigate("/dashboard/employees")}
                />
              </div>

              <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
                <Card className="overflow-hidden">
                  <CardHeader
                    title="Member growth"
                    subtitle="New organization members by month"
                    action={
                      <div className="flex items-center gap-1.5">
                        <TinyButton active>6 months</TinyButton>
                      </div>
                    }
                  />
                  {trend.some((point) => point.value > 0) ? (
                    <TrendChart points={trend} />
                  ) : (
                    <EmptyState
                      icon={Activity}
                      title="Not enough activity yet"
                      text="Member growth will become visible as more people join the organization."
                    />
                  )}
                </Card>

                <Card className="overflow-hidden">
                  <CardHeader
                    title="People mix"
                    subtitle="Distribution by role"
                  />
                  <RoleMixChart
                    counts={roleCounts}
                    total={totalUsers}
                  />
                </Card>
              </div>

              <QuickActions organization={organization} />

              <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr]">
                <Card>
                  <CardHeader
                    title="Department coverage"
                    subtitle="People grouped by department"
                    action={
                      <TinyButton
                        onClick={() => navigate("/dashboard/hr")}
                      >
                        Manage departments
                      </TinyButton>
                    }
                  />
                  <DepartmentChart
                    departments={departmentCounts}
                  />
                </Card>

                <OrganizationHealth
                  organization={organization}
                  totalUsers={totalUsers}
                  activeUsers={activeUsers}
                />
              </div>

              <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr]">
                <RecentPeople
                  users={scopedUsers}
                  onViewAll={() => navigate("/dashboard/users")}
                />
                <ActivityCard users={scopedUsers} />
              </div>

              <PeoplePreview
                users={scopedUsers}
                search={peopleSearch}
                onSearchChange={setPeopleSearch}
                onViewAll={() => navigate("/dashboard/users")}
              />

              <FeatureGrid organization={organization} />

              <div className="grid gap-5 xl:grid-cols-[1.3fr_0.9fr]">
                <OrganizationDetails organization={organization} />
                <ContactCard organization={organization} />
              </div>

              <div className="grid gap-5 xl:grid-cols-3">
                <PlanCard organization={organization} />
                <SecurityCard organization={organization} />
                <OrganizationCodeCard
                  organization={organization}
                />
              </div>

              <PublicIdNotice />

              <div className="flex flex-col gap-3 border-t border-gray-200 pb-5 pt-2 text-[10px] text-gray-400 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Paisa organization workspace · {organization.name}
                </span>
                <span>
                  Last refreshed{" "}
                  {new Date().toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </main>
        </div>
      </div>

      <MobileMenu
        open={mobileMenu}
        onClose={() => setMobileMenu(false)}
        currentPath={currentPath}
      />

      <EditOrganizationModal
        open={editOpen}
        organization={organization}
        onClose={() => setEditOpen(false)}
        onSaved={() => {
          void organizationsQuery.refetch();
        }}
      />
    </div>
  );
}
