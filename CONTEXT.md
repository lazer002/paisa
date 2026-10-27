# PROJECT CONTEXT — the ONLY context file (read this FIRST in every session)

> **RULE FOR AI ASSISTANTS:** Read this file before doing anything. After every
> session — no matter how small — **update this file**: tick finished Backlog
> items, record new decisions/gaps, and prepend an entry to the Session Log (§12).
> Never redo a full project analysis if this file already has the answer.
> This file replaced SKILL.md, IMPROVEMENTS.md, structure.txt, `kya vishye.md`
> and client/README.md (2026-10-27). They are still in git history if needed
> (`git show 60cb432:"kya vishye.md"` = the 5,270-line aspirational product spec).

Last updated: 2026-10-27 (verified against live code)

---

## 1. What this project is

**PAISA**: a multi-tenant SaaS covering ERP, HRMS, LMS and CRM for schools,
colleges, coaching institutes, companies and startups. Each organization
(tenant) is isolated by `instituteId`.

- `school / college / coaching` → academic roles (principal, teacher, student, parent)
- `company / startup` → business roles (hr, employee, accountant, counselor)

Domains: Organizations, Users/RBAC, People (Students/Teachers/Employees/HR),
Departments, Classes/Enrollments, Assignments/Submissions, Attendance, Tests/
Questions/Attempts, Study Materials, Live Sessions, Announcements/Events,
Notifications, Messaging, Tickets, Leaves, Payroll/Salary Structures,
Performance Reviews, Certificates, CRM (Leads/Deals/Pipelines), Invoices/
Payments, Gamification, Audit Logs.

## 2. Tech stack (verified from package.json)

| Side | Stack |
|---|---|
| server/ | Node **≥20**, ES modules, Express **5**, Mongoose 8 / MongoDB, Redis 6 (optional, `REDIS_REQUIRED=true` to enforce), Joi, JWT, bcryptjs, helmet, cors, express-rate-limit, compression |
| client/ | React **19**, Vite **8**, TypeScript ~6, Redux Toolkit + **RTK Query**, react-router-dom **7**, Tailwind **v4** (`@tailwindcss/vite`), lucide-react, axios |
| root | npm workspaces (`client`, `server`) + `concurrently` |

NOT Next.js, NOT Zustand, NOT React Query (older docs said otherwise and have been deleted).

## 3. Running & checking

```bash
npm install              # root: installs both workspaces (use Node ≥20!)
npm run dev              # API (nodemon, :5000) + UI (vite, :5173) together
npm run build            # server build is a no-op echo; client = tsc -b && vite build
npm run seed             # ⚠️ BROKEN: server/src/utils/seed.js does not exist

cd server && npm run check   # node --check server.js (entry file only)
cd server && npm test        # node --test → finds 0 test files today
cd client && npm run lint    # eslint
cd client && npm run build   # tsc -b + vite build = the client typecheck
```

- Vite proxies `/api` → `VITE_API_PROXY_TARGET` (default `http://127.0.0.1:5000`).
  Leave `VITE_API_URL` unset in dev so refresh cookies stay same-origin.
- `server/.env` exists locally (git-ignored). No `client/.env` needed in dev.
- **Environment trap (this machine):** the default `node` on PATH is
  **v12.18.3**, which can't parse `?.`, so every server file "fails" and the
  client build crashes. nvm has v20.11.1, v22.14.0 and v24.21.0 installed. Run
  `nvm use 22.14.0` (or, in the agent shell, prefix
  `export PATH="$HOME/AppData/Local/nvm/v22.14.0:$PATH"`).
- To syntax-check every server file: `for f in $(git ls-files server/src | grep .js$); do node --check $f; done`

## 4. Repository layout

```
paisa/
├── AGENTS.md                       agent rules (feature-workflow skill + this file)
├── CONTEXT.md                      ← this file (single source of project context)
├── README.md                       short pointer + run commands
├── .agents/skills/feature-workflow/SKILL.md   7-phase workflow skill
├── server/
│   ├── server.js                   connectDB → optional Redis → http server, graceful shutdown
│   └── src/
│       ├── app.js                  middleware pipeline; /health, /health/live, /health/ready
│       ├── config/                 env.js (typed env), db.js, redis.js, logger.js, constants.js (ROLES), userRoleConfig.js
│       ├── routes/                 29 route files, all mounted in routes/index.js under env.API_PREFIX (default /api)
│       ├── controllers/            29 controllers (asyncHandler + ApiError + tenant scoping)
│       ├── middleware/             authenticate, authorize, tenant, domain, ownership, policies, audit, rateLimiter, validate (Joi), security, requestId
│       ├── models/                 53 Mongoose models (many 1–2k lines, rich statics/methods)
│       ├── services/authService.js login / refresh / logout / logoutAll / register
│       ├── utils/                  permissions.js (1,619-line RBAC matrix), resolveRef.js, ApiError, ApiResponse, jwt, crypto, password, pagination, sanitize, sequence, peopleHelpers…
│       └── validators/authValidator.js   (only validator file; other routes validate inline or not at all)
└── client/
    ├── scripts/generate-permissions.mjs  regenerates src/config/permissions.ts from the server matrix
    └── src/
        ├── app/                    store.ts, layouts/DashboardLayout, providers, router/AppRouter.tsx
        ├── components/auth/        AuthGuard, RoleGuard, Can
        ├── components/ui/          button, badge, Modal, PageHeader, StatCard, StateViews, kit
        ├── components/notifications/NotificationBell.tsx
        ├── config/                 roles.ts (NAV_SECTIONS + PATH_PERMISSION), permissions.ts (AUTO-GENERATED)
        ├── features/<domain>/      one RTK Query createApi slice per domain (21 slices)
        ├── lib/api/                axios.ts (Bearer + 401→refresh→retry), axiosBaseQuery.ts, refresh.ts (single-flight)
        ├── lib/auth/               bootstrapAuth.ts, usePermission.ts
        ├── lib/store/authSlice.ts  user (localStorage `auth-profile`) + token (memory only)
        └── pages/                  LoginPage, NotFoundPage, dashboard/ (36 pages)
```

## 5. API surface (`/api/...`)

auth · organizations · users · hr · employees · students · teachers · classes ·
assignments · submissions · attendance · study-materials · announcements ·
payroll · leaves · departments · stats (superadmin/admin/teacher/student/hr/
employee/accountant/counselor/support) · tests · questions · attempts ·
enrollments · invoices (+ payments) · leads · deals · pipelines · tickets ·
salary-structures · reviews · certificates · gamification · events ·
conversations · messages · live-sessions · notifications · `GET /` (API info).

- Envelope: `{ success, message, data }`; errors `{ success:false, message, code, requestId }`.
- Every resource has an immutable `publicId` (`user_…`, `org_…`). URLs and
  reference fields in bodies carry publicIds; controllers resolve them with
  `resolveRef(Model, ref, { label })`. Client helper `rid(record)` (in
  `features/users/usersApi.ts`) returns `publicId ?? _id`.

## 6. Auth contract (do not break)

1. `POST /auth/login` (rate-limited, Joi, audited) and `POST /auth/refresh` both return
   `{ data: { user, accessToken, expiresAt, sessionId } }`.
2. Client keeps `accessToken` **in Redux memory only**; refresh token lives in the httpOnly cookie `paisa_refresh_token` (`paisa_access_token` is also set).
3. 401 → axios single-flight `POST /auth/refresh` → retry once → else `logout()` → `/login`.
4. On boot `bootstrapAuth` silently refreshes.
5. Refresh JWT payload has `tokenHash` = sha256(session secret), compared against `RefreshSession.tokenHash`. Never hash the JWT string.
6. Revocation fields are `revokedAt`/`revokedReason` (`.revoke()`, `.revokeUserSessions()`, `.revokeFamily()`). There is no `revoked` boolean. Rotation goes through `session.rotate(newHash, newExpiresAt)`. The session IP field is `ip`, not `ipAddress`.

## 7. Roles & permission architecture

| Role | Level | Intended job |
|---|---|---|
| super_admin | 100 | Platform-wide: all orgs, users, reports (bypasses every check) |
| admin | 90 | Org owner: everything inside one organization |
| principal | 80 | School head: academics + read HR/finance, approve leaves |
| hr | 70 | Employees, leaves, payroll, performance, documents |
| accountant | 70 | Invoices, payments, payroll read, billing |
| counselor | 60 | Admissions: CRM leads/deals, students/parents, enrollments |
| teacher | 60 | Classes, assignments, tests, attendance, materials |
| support | 50 | Tickets + messaging |
| employee | 40 | Self-service: attendance, leaves, own payroll, tickets |
| parent | 30 | View child's classes/assignments/tests/attendance/invoices |
| student | 20 | Learning, submissions, test attempts, invoices |

**Server is the security boundary.** `server/src/utils/permissions.js` has
`PERMISSIONS` (`resource:action`), per-role maps, hierarchy and helpers (`hasRole`,
`hasPermission`, `hasAnyPermission`, `canManageRole`, …). All helpers take a
**user object**, not a role array. `middleware/authorize.js` exports
`requireRole`, `requirePermission`, `requireAnyPermission`, `authorize({ roles, permissions, anyPermissions, minimumRole })`.

Two gating styles coexist and can drift apart:
- **Legacy `requireRole(...)` only:** announcement, assignment, attendance, class, department, employee, payroll, stats, student, studyMaterial, submission, teacher routes.
- **Permission-based only:** billing, crm, enrollment, event, gamification, hrOps, liveSession, message, notification, organization, test, ticket routes.
- **Mixed:** hr, leave, user routes.

**Client mirror:** `client/src/config/permissions.ts` is generated by
`node scripts/generate-permissions.mjs` (run from `client/`). Never hand-edit it.
`config/roles.ts` holds `PATH_PERMISSION` (route → permission) and `NAV_SECTIONS`
(`roles` per item). Nav shows an item only if both pass. `RoleGuard` blocks
routes, and `<Can permission>` / `usePermission()` gate things inside a page.

**Multi-tenancy:** `authenticate.js` loads the user and org into `req.user` / `req.auth`.
Non-super_admin queries are forced to `query.instituteId = req.user.instituteId`,
and cross-tenant access throws `TENANT_ACCESS_DENIED`. Never trust a body `instituteId`
from normal users. `domain.js` (`allowDomains`) restricts by org type and
`ownership.js` does row checks.

**Identity model:** `User` = login, role and security. `Employee`, `teacher` and `student`
are separate business profiles linked to a User. Do not assume Teacher === Employee === User.

## 8. Feature state (verified 2026-10-27)

✅ full & wired · 🟡 partial · ❌ not started

| Feature | State | Notes |
|---|---|---|
| Auth + dashboard home (per-role stats) | ✅ | |
| Organizations + detail (super_admin) | ✅ | 2,808-line page |
| Companies / Institutes | 🟡 | 56-line read-only card filters of orgs |
| Users + user detail | ✅ | 3,608 / 2,134 lines |
| Departments, Teachers | ✅ | |
| Students | ✅ | create/update/delete added in 60cb432 |
| Employees | ✅ | create/update/delete added in 60cb432 |
| HR panel | ✅ | create/update/delete added in 60cb432 |
| HR Ops (salary structures, reviews, certificates) | ✅ | |
| Classes, Assignments + submissions | ✅ | parent now allowed (B1 fixed). See gap G2 |
| Enrollments, Tests/Questions/Attempts, Materials, Live sessions | ✅ | |
| Attendance | ✅ basic | ❌ geofence / QR / device: models + perms exist, no routes/UI |
| Leaves, Payroll | ✅ | |
| Messages, Announcements, Events, Notifications | ✅ | |
| Invoices + payments | ✅ | |
| Billing | 🟡 | plan change via `updateOrganization`; no payment/subscription engine |
| CRM leads/deals/pipelines | ✅ | ❌ Contact & Customer models have no routes/UI |
| Tickets, Gamification, Settings | ✅ | |
| Reports | ✅ | variants for all 8 nav roles + server `/stats/{accountant,counselor,support}` |
| Employee documents | ❌ | model + `employee_document:*` perms only |
| Audit log viewer | ❌ | `AuditLog` written by audit middleware; no read API/UI |

## 8b. Per-role completeness (static audit 2026-10-27, not runtime-tested)

Method: permission matrix × server route gating (173 routes) × client nav + the
RTK hooks each page calls + the role checks inside each page. % = (works + ½·partial) / features
the role is meant to have. "Load-403" = page queries an endpoint on load that the server
denies → page shows an error/empty state.

| Role | ~Done | Broken / missing (what to work on) |
|---|---|---|
| super_admin | 75% | Companies/Institutes read-only · no audit-log viewer · no platform billing/plans view · no report export |
| admin | 85% | Settings notif-prefs load-403 (admin lacks `notification_preference:*`) · Gamification not in nav though allowed · CRM pipelines no UI · no employee docs / audit / CRM contacts+customers / geofence-QR attendance · billing has no payments |
| principal | 50% | **Load-403 on Classes, Assignments, Teachers, Payroll, HR Ops (salary tab), Settings** (classRoutes/assignmentRoutes/teacherRoutes/payrollRoutes `requireRole` omit principal; salary perm missing) · Leaves "apply" form shown but no `leave:create` · Live-session delete button shown, server denies |
| hr | 65% | Load-403 on Teachers page + HR Ops certificates tab · Settings notif-prefs 403 · Events delete button shown (no `event:delete`) · TicketsPage treats hr as staff but hr lacks `ticket:update`/`ticket_message:create` · no employee documents |
| accountant | 45% | **Payroll page load-403** (payrollRoutes omit accountant) · Billing plan update 403 · no UI to change invoice status (server allows) · Settings 403 · cannot reply to own tickets · `finance:*` perms have no backend |
| counselor | 55% | No Enrollments nav though holds `enrollment:create` (server allows) · CRM contacts/customers/activities/tasks/notes ❌ · pipelines read no UI · Announcements create blocked by server `requireRole` despite B3 · Events create allowed server-side but no button · Settings 403 |
| teacher | 75% | Settings 403 · host can't delete own live session (no `live_session:delete`) · Events create allowed server-side but no button · can't reply to own tickets |
| support | 85% | Settings notif-prefs 403 · `customer:*` perms unused |
| employee | 75% | can't reply to own tickets · performance reviews readable server-side, no UI · no employee documents · gamification allowed, not in nav |
| parent | 40% | **No parent↔child link (G2)** → sees institute-wide data, no child selector · can't reply to tickets · certificates/enrollments readable, no UI |
| student | 65% | **Cannot take tests**: `startAttempt`/`submitAttempt` exist in `assessmentApi.ts` but no page uses them · no certificates UI · can't reply to own tickets · duplicate nav items (Classes/My Classes, Live Sessions ×2) |

Cross-role defects (fix once, helps many roles):
- **X1** `GET/PUT /notifications/preferences` needs `notification_preference:*`, held only by super_admin, employee, parent, student → Settings broken for 7 roles.
- **X2** Ticket replies need `ticket_message:create`/`ticket:update`, held only by super_admin/admin/support → requesters can't reply to their own tickets, and hr is shown staff actions.
- **X3** Pages gate buttons with hard-coded role arrays (`['super_admin','admin','hr'].includes(role)`) instead of `<Can>`/`usePermission`, so UI and server drift (Events, LiveSessions, Tickets, Materials, Leaves, Tests, Gamification).
- **X4** Legacy `requireRole` lists omit principal/accountant on routes their nav exposes.
- **X5** Duplicate nav entries (Employees, Departments, Payroll for admin; Classes, Live Sessions for student/parent).
- Audit script (re-runnable): written to a temp dir outside the repo; logic = parse `routes/index.js` mounts + per-route `requireRole`/`authorize`, `ROLE_PERMISSIONS`, `NAV_SECTIONS`/`PATH_PERMISSION`, page hooks → slice URLs.

## 9. Known problems (verified 2026-10-27, highest severity first)

- **S1 🔴 SECURITY: public registration lets anyone become super_admin or join any tenant.**
  `POST /api/auth/register` is unauthenticated. `registerSchema`
  (`server/src/validators/authValidator.js`) accepts any `role` from
  `Object.values(ROLES)` plus any `instituteId`. Its super_admin guard checks
  `value.roles?.includes(...)` (plural) but the field is `role`, so the guard never
  fires. `authService.register` writes `role` and `instituteId` straight into
  `User.create`.
- **G1 🔴 Client build fails (546 TS errors) and server can't start** in the current
  checkout. Root cause: incomplete `node_modules`. `client/node_modules` lacks
  `react-redux` and `@reduxjs/toolkit`, and `server/node_modules/express` is an empty
  dir. Nearly all errors are knock-on TS2307/TS2347/TS7006 errors. A clean
  `npm install` under Node ≥20 should clear them. Re-check afterwards.
- **G1b** `server/node_modules` is **committed to git** (1,284 files, partial: mongodb,
  mongoose, nodemon…). This is why installs are half-broken. Fix with `git rm -r --cached server/node_modules`
  (`server/.gitignore` already lists `/node_modules`).
- **G1c** Casing mismatch: git tracks `client/src/components/ui/button.tsx` and `badge.tsx`
  (lowercase, matching the imports) but the working copy on disk is `Button.tsx` / `Badge.tsx`
  → TS1261. Rename on disk to lowercase.
- **G1d** Lint error: unused `useAppSelector` import in `BillingPage.tsx:11`. Stale
  `eslint-disable` warning at the top of generated `permissions.ts`.
- **G2 🟠 Parents see institute-wide data.** There is no parent↔child link: `student.guardian`
  is only name/relationship/phone, with no user ref. So parent scoping in
  `assignmentController` / `classController` falls back to "all published in the institute".
  This needs a `parentUserIds` (or similar) link on the student profile before parent views are private.
- **G3** Two gating styles (§7) can drift. Long-term: migrate to permission-based.
- **G4** `npm run seed` is broken (no seed.js). There are no tests at all (server `node --test` finds 0 files, client has no test runner).
- **G5** Only `authValidator.js` exists. Most write routes have no Joi validation, so check mass-assignment on create/update controllers.
- **G6** `client/tsconfig.tsbuildinfo` is committed (build artifact) and should be git-ignored.
- **G7** Root `package.json` is still named `yolo-hrm`.

## 10. Conventions

**Server**
- Route chain: `authenticate → rateLimiter → validateBody → audit → authorize → handler`.
- Controllers: `asyncHandler`, throw `ApiError.xxx(msg, CODE)`, always tenant-scope.
- Vertical formatting (one arg per line) in many files. Match the surrounding style.
- New resource: model (with `instituteId`, timestamps, indexes, `publicId`) → controller → validator → route → mount in `routes/index.js` → `node --check`.
- Spec rules worth keeping: no duplicate models, preserve multi-tenancy and auditability, soft-delete where supported, never use frontend auth as the boundary, use transactions for multi-record critical flows.

**Client**
- RTK Query slice per domain using `axiosBaseQuery`, `tagTypes` + `providesTags`/`invalidatesTags`,
  `transformResponse: (r) => r?.data ?? r`.
- New page: page in `pages/dashboard/` → slice → route in `AppRouter.tsx` → nav entry +
  `PATH_PERMISSION` in `config/roles.ts`.
- UI kit in `components/ui/`, `StateViews` for loading/error/empty, path alias `@ → src`.

## 11. BACKLOG (ordered, tick when done)

**P0 — security & broken build**
- [x] S1. (done 2026-10-27: disabled unless ALLOW_PUBLIC_REGISTRATION=true; role/tenant never accepted) Lock down `/auth/register`: drop `role`/`instituteId` from the public schema (or force default role + no tenant, or require auth+`user:create`). Fix the `roles`→`role` guard.
- [x] G1. (done 2026-10-27) Clean install under Node 22, untrack `server/node_modules`, fix button/badge casing, fix BillingPage lint, then get `npm run lint` + `npm run build` green.

**P1 — role blockers (see §8b)**
- [ ] R1. Principal: allow on classes/assignments/teachers/payroll GET (+ salary read) — fixes 5 load-403 pages.
- [ ] R2. Accountant: allow payroll GET; billing/invoice-status UI for accountant.
- [ ] R3. X1 notification-preference perms for all roles (Settings page).
- [ ] R4. X2 ticket replies for requesters; align hr staff status.
- [ ] R5. Student test-taking UI (start → answer → submit) using existing endpoints.
- [ ] R6. HR: teachers read + certificates read; events delete alignment.
- [ ] R7. X3 replace hard-coded role arrays in pages with `<Can>`/`usePermission`.
- [ ] R8. X5 dedupe nav; counselor Enrollments nav; Gamification nav for admin/employee.

**P1b — correctness of shipped features**
- [ ] G2. Parent↔child link on the student profile + scope parent queries to their children.
- [ ] F4. Billing: real subscription/payment flow (decide product scope first).
- [ ] F5. Companies/Institutes: proper management views, or fold them into Organizations filters.

**P2 — models + permissions with zero implementation**
- [ ] M1. Employee documents (routes + UI under HR Ops).
- [ ] M2. Geofence / QR session / device attendance.
- [ ] M3. Audit log viewer (`audit:read`, super_admin/admin).
- [ ] M4. CRM Contacts & Customers.

**P3 — hardening**
- [ ] H1. Migrate `requireRole` routes to permission-based gating.
- [ ] H2. Tests: server `node --test` for auth/tenant isolation first, then client.
- [ ] H3. Joi validators for write routes (G5).
- [ ] H4. Working seed script.
- [ ] H5. Verify `report:export` flow.

Done (from the 2026-10-25 backlog, in commit 60cb432): B1 parent access to classes/
assignments · B2 Reports for all nav roles · B3 nav/permission reconciliation (leaves for
teacher+student, announcements for counselor) · F1 Students CRUD · F2 Employees CRUD · F3 HR panel CRUD.

## 12. Session log (newest first)

- **2026-10-27 — Per-role completeness audit.** Wrote a static audit cross-checking the permission
  matrix, 173 server routes, nav and page hooks for all 11 roles, then manually verified the
  flagged pages. Added §8b (per-role % + gaps) and backlog R1–R8. Biggest findings: principal
  has 5 pages that 403 on load, accountant's Payroll page 403s, Settings is broken for 7 roles,
  requesters can't reply to their own tickets, and students have no test-taking UI.

- **2026-10-27 — Consolidated context + deep re-verification.** Merged SKILL.md,
  IMPROVEMENTS.md (fictional changelog), structure.txt (stale), `kya vishye.md`
  (aspirational spec) and client/README.md (Vite boilerplate) into this file, then deleted
  them and the stale lint dumps (`client/lint-list.txt`, `client/lint-now.json`). README.md
  is now a short pointer. Verified that B1–B3 and F1–F3 were already done in 60cb432.
  Found S1 (privilege escalation via public register), G1 (broken install → client build/server
  start fail; node_modules committed; casing), G2 (parent has no child link). Found the
  Node v12 PATH trap. Ran `node --check` on all server files under Node 22: 0 failures.
  Client lint: 1 error, 1 warning. Client build: 546 errors, mostly from missing deps.
- **2026-10-25 — Full role/feature analysis + P0/P1 fixes** (commit 60cb432): roles,
  permission architecture, generated client permissions, Can/usePermission, Reports variants,
  Students/Employees/HR CRUD.
