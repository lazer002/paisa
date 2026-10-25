# PROJECT CONTEXT (read this FIRST in every session)

> **RULE FOR AI ASSISTANTS:** Read this file before doing anything. After every
> session — no matter how small — **update this file**: mark finished work in the
> Backlog, add a line to the Session Log, and record any new decision/gap found.
> Never redo a full project analysis if this file already has the answer.

Last updated: 2026-10-25

---

## 1. What this project is

**PAISA** — multi-tenant organization/education management platform.

- `client/` — React 19 + TypeScript + Redux Toolkit (RTK Query) + Tailwind + react-router
- `server/` — Node/Express (ES modules) + Mongoose/MongoDB
- Root build: `npm run build` (root) · client: `npm run lint`, `npm run build` (tsc) · server: `npm test`, `npm run check`
- Client has **1 test file** only — coverage is weak; always run lint+build after client changes.

## 2. Permission architecture (how restrictions work)

**Server is the source of truth** (`server/src/utils/permissions.js`):
- 11 roles, `ROLE_HIERARCHY` (super_admin 100 → student 20), ~230 permissions like `student:read`, `payroll:create`.
- Two gating styles coexist in `server/src/routes/*.js`:
  1. **Legacy** `requireRole("super_admin","admin",...)` — used by classRoutes, assignmentRoutes, attendanceRoutes, studyMaterialRoutes, leaveRoutes, payrollRoutes, employeeRoutes, studentRoutes, departmentRoutes, statsRoutes, announcementRoutes, hrRoutes, organizationRoutes, userRoutes.
  2. **Modern** permission option `{ anyPermissions: [...] / permissions: [...] }` — used by testRoutes, hrOpsRoutes, crmRoutes, messageRoutes, gamificationRoutes, notificationRoutes, ticketRoutes, billingRoutes, liveSessionRoutes, eventRoutes, enrollmentRoutes (~99 gated routes total).
  - ⚠️ The two styles can **disagree** with the client matrix (see §5 bugs).

**Client mirror** (`client/src/config/permissions.ts`) is **AUTO-GENERATED** —
regenerate with `node scripts/generate-permissions.mjs` (from `client/`) after
changing the server matrix. Never hand-edit it.

**Client-side enforcement:**
- `client/src/config/roles.ts` → `PATH_PERMISSION` (route → required permission) + `NAV_SECTIONS` (each item has a `roles` filter). Nav shows item only if BOTH pass.
- `RoleGuard` (`components/auth/RoleGuard.tsx`) uses `allowedPathsForRole()` → redirects blocked routes to an "Access restricted" screen.
- `<Can permission="x">` (`components/auth/Can.tsx`) + `usePermission()` hook for in-page gating.
- `super_admin` bypasses every permission check (`roleCan` returns true).

## 3. The 11 roles

| Role | Hierarchy | Intended job |
|---|---|---|
| super_admin | 100 | Platform: all orgs, companies, institutes, users, reports (holds ALL permissions) |
| admin | 90 | Org owner: everything inside one organization |
| principal | 80 | School head: academics + read HR/finance, approve leaves |
| hr | 70 | Workforce: employees, leaves, payroll, performance, documents |
| accountant | 70 | Finance: invoices, payments, payroll read, billing |
| counselor | 60 | Admissions: CRM leads/deals, students/parents, enrollments |
| teacher | 60 | Teaching: classes, assignments, tests, attendance, materials |
| support | 50 | Tickets + messaging only |
| employee | 40 | Self-service: attendance, leaves, own payroll, tickets |
| parent | 30 | View child's classes/assignments/tests/attendance/invoices |
| student | 20 | Self-service learning, submissions, test attempts, invoices |

## 4. Feature state (UI page → API → gating)

State legend: ✅ full CRUD & wired · 🟡 partial / read-only · ❌ not started

| # | Feature (route) | State | Notes |
|---|---|---|---|
| 1 | Auth + `/dashboard` home | ✅ | stats per role |
| 2 | Organizations `/organizations` (super_admin) | ✅ | 2808-line page + detail page |
| 3 | Companies `/companies` | 🟡 | read-only cards, filter of orgs — no create/manage of its own |
| 4 | Institutes `/institutes` | 🟡 | read-only cards, same as above |
| 5 | Users `/users` + detail | ✅ | 3608/2134 lines, full user management |
| 6 | Departments | ✅ | 780 lines |
| 7 | Teachers | ✅ | 852 lines |
| 8 | Students `/students` | 🟡 | read-only table; no create/edit/detail UI ("add via API" hint) |
| 9 | Employees `/employees` | 🟡 | read-only table; create only via Users page |
| 10 | HR Panel `/hr` | 🟡 | read-only HR card list (48 lines) |
| 11 | HR Ops `/hr-ops` | ✅ | salary structures, performance reviews, certificates (routes in hrOpsRoutes) |
| 12 | Classes | ✅ | but server excludes `parent` (see §5 bug 1) |
| 13 | Enrollments | ✅ | permission-gated routes |
| 14 | Assignments + submissions | ✅ | server excludes `parent` (bug 1) |
| 15 | Tests / questions / attempts | ✅ | 493 lines, permission-gated |
| 16 | Study Materials | ✅ | |
| 17 | Live Sessions | ✅ | |
| 18 | Attendance | ✅ basic | ❌ geofence, QR session, device — **models + permissions exist, NO routes, NO UI** |
| 19 | Leaves | ✅ | approve flow; nav omits teacher/student despite `leave:read` (bug 3) |
| 20 | Payroll | ✅ | |
| 21 | Messages / conversations | ✅ | 365 lines |
| 22 | Announcements | ✅ | nav omits counselor though they hold `notification:create` (bug 3) |
| 23 | Events | ✅ | |
| 24 | Invoices + record payment | ✅ | billingRoutes has `/payments` |
| 25 | Billing `/billing` | 🟡 | static plan cards, Upgrade button does nothing — no subscription engine |
| 26 | CRM | ✅ leads/deals/pipelines | ❌ `Contact` + `Customer` models have **no routes/UI** |
| 27 | Tickets | ✅ | |
| 28 | Gamification | ✅ | achievements, points, leaderboard, streaks |
| 29 | Settings | ✅ | profile, password, notification preferences |
| 30 | Reports `/reports` | 🟡 | only super_admin/admin/hr variants render; other 6 nav roles get an empty page (bug 2) |
| 31 | Employee documents | ❌ | model + `employee_document:*` permissions exist, no routes/UI |
| 32 | Audit log viewer | ❌ | `AuditLog` model + `audit:read/export` perms exist; only auth writes audit, no read API/UI |
| 33 | CRM contacts/customers | ❌ | models exist, no routes/UI |

## 5. Known bugs / inconsistencies (found 2026-10-25)

1. **Parent gets 403** on My Classes & My Assignments: `classRoutes` / `assignmentRoutes` use `requireRole(super_admin, admin, teacher, student)` — `parent` missing, although parent has `class:read`/`assignment:read` and nav shows those pages.
2. **Reports page broken for 6 roles**: nav grants `/reports` to principal, teacher, hr, accountant, counselor, support, but `ReportsPage.tsx` only implements super_admin/admin/hr; everyone else falls into the HR branch with queries skipped → empty page. Server already has `/stats/teacher`, `/stats/student`, `/stats/employee` endpoints.
3. **Nav vs permission mismatches**: teacher & student hold `leave:read` but no nav/RouteGuard access to `/leaves`; counselor holds `notification:create` but Announcements nav excludes counselor.
4. **Two gating styles** on the server (requireRole vs permission matrix) can drift — long-term: migrate all routes to permission-based gating.
5. `student`/`employee`/`parent` hold `device:read` and `geofence:read` etc. for features that don't exist yet (§4 #18).

## 6. BACKLOG — work remaining, suggested order (check off as done)

> Update this list after every session: move finished items to §7 Session Log.

**P0 – bugs in shipped features**
- [ ] B1. Allow `parent` in classRoutes/assignmentRoutes GET (and verify attendance/materials/test GETs for parent).
- [ ] B2. ReportsPage: add variants for principal/teacher/accountant/counselor/support (reuse `/stats/*` endpoints; add missing server stats where needed).
- [ ] B3. Reconcile nav `roles` lists with the permission matrix (leaves for teacher/student, announcements for counselor) — decide product intent first.

**P1 – finish partial pages (role features that are half-built)**
- [ ] F1. Students page: create/edit/detail UI for student profiles.
- [ ] F2. Employees page: create/edit/detail UI (employee profile, docs entry point).
- [ ] F3. HR Panel: real HR management instead of read-only card list.
- [ ] F4. Billing: real subscription/plan management (org plan update + payment flow).
- [ ] F5. Companies/Institutes: proper management views (or replace with filtered Organizations view).

**P2 – modules with models+permissions but zero implementation**
- [ ] M1. Employee documents (model `EmployeeDocument`, perms exist → routes + UI under HR Ops).
- [ ] M2. Geofence / QR-session / device attendance (models exist → routes + UI).
- [ ] M3. Audit log viewer (`audit:read` → API + page for super_admin/admin).
- [ ] M4. CRM Contacts & Customers (models exist → routes + CRM UI tabs).

**P3 – hardening**
- [ ] H1. Migrate remaining `requireRole` routes to permission-based gating.
- [ ] H2. Test coverage (only 1 test file in the repo today).
- [ ] H3. Verify `report:export` endpoints/UI (permission exists; export flow not verified).

## 7. Session log (append new entries at the TOP)

- **2026-10-25 — Prioritization & plan to reach ~90% role completeness.** Reviewed full codebase state. **NOW:** Fixing P0 bugs first (B1 parent access to classes/assignments, B2 reports for non-admin roles, B3 nav/permission reconciliation), then completing high-impact partial pages (Students F1, Employees F2, HR Panel F3). **NEXT:** Billing basics (F4), Companies/Institutes cleanup (F5), then selectively tackle P2 items only if they block role workflows. Goal: make every role able to actually use what the nav shows with minimal scope creep.
- **2026-10-25 — Full role/feature analysis.** Mapped all 11 roles, permission
  architecture (server matrix + generated client mirror + RoleGuard + nav gating),
  every dashboard page (33 features: 24 ✅, 6 🟡, 4 ❌), server gating styles
  (requireRole vs permission option), and found 5 inconsistencies (§5).
  Created this CONTEXT.md; backlog in §6.
