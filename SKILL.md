# PAISA — Project Skill File

**Last verified:** 2026-09-29 (analysis of live code, not stale docs)
**Version:** server `3.0.0` (PAISA multi-tenant ERP + HRMS + LMS SaaS)

> ⚠️ **Docs drift warning:** `README.md` and `PROJECT.txt` describe an OLD stack
> (Next.js, Zustand, 6 roles, old middleware names). `structure.txt` is partially stale.
> `kya vishye.md` (5,270 lines) is the closest-to-truth product spec. This file is the
> source of truth for the ACTUAL current state.

---

## 1. What This Project Is

Multi-tenant SaaS platform for schools, colleges, coaching institutes, companies and
startups. ERP + HRMS + LMS in one. Each organization (tenant) is fully data-isolated
via `instituteId`. Multiple org types:

- `school / college / coaching` → academic roles (teacher, student, principal, parent)
- `company / startup` → business roles (hr, employee, accountant, counselor)

Core domains: Organizations, Users/RBAC, People (Students/Teachers/Employees),
Classes/Enrollments, Assignments/Submissions, Attendance (incl. QR/Geofence/Devices),
Tests/Questions/Attempts, Study Materials, Live Sessions, Announcements/Events,
Leaves, Payroll/Salary Structures, Performance Reviews, Departments, CRM
(Leads/Deals/Pipelines), Messaging/Conversations, Support Tickets, Gamification
(Achievements/Points/Streaks/Leaderboards), Invoices/Payments, Audit Logs,
Notifications, Refresh Sessions/Devices.

---

## 2. Repository Layout (verified)

```
paisa/  (npm workspaces: client + server)
├── SKILL.md                  ← this file
├── kya vishye.md             ← full product/architecture spec (best reference)
├── PROJECT.txt               ← STALE (old Next.js-era docs)
├── README.md                 ← STALE (Next.js-era)
├── IMPROVEMENTS.md           ← old changelog
├── structure.txt             ← partially stale
├── package.json              ← workspaces + dev/build/seed scripts
│
├── server/                   Express 5 API (ESM, Node ≥20)
│   ├── server.js             entry: connectDB → optional Redis → http server, graceful shutdown
│   └── src/
│       ├── app.js            middleware pipeline, /health + /health/live + /health/ready
│       ├── config/           env.js (560-line typed env), db.js, redis.js, logger.js, constants.js
│       ├── controllers/      18 controllers (auth, user, userDetail, hr, employee,
│       │                     student, teacher, class, assignment, submission,
│       │                     attendance, studyMaterial, announcement, payroll,
│       │                     leave, department, organization, stats)
│       ├── middleware/       authenticate.js (access token), authorize.js (roles+permissions),
│       │                     tenant.js, domain.js, ownership.js, policies.js, audit.js,
│       │                     rateLimiter.js, validate.js (Joi), security.js, requestId.js
│       ├── models/           ~50 Mongoose models (see §7)
│       ├── routes/           18 route files + index.js (mounted under env.API_PREFIX, default "/api")
│       ├── services/         authService.js (login, refresh, logout, logoutAll, register)
│       ├── utils/            permissions.js (1,525-line RBAC engine), ApiError.js,
│       │                     ApiResponse.js, asyncHandler.js, jwt.js, crypto.js,
│       │                     password.js, pagination.js, sanitize.js, sequence.js,
│       │                     peopleHelpers.js, redis.js, response.js, validation.js
│       └── validators/       authValidator.js (Joi schemas)
│
└── client/                   React 19 + Vite 8 + TS SPA
    └── src/
        ├── app/              store.ts (Redux), layouts/DashboardLayout, providers, router/AppRouter.tsx
        ├── components/       auth/ (AuthGuard, RoleGuard), ui/ (badge, button, Modal,
        │                     PageHeader, StatCard, StateViews)
        ├── config/roles.ts   NAV_SECTIONS + allowedPathsForRole() — nav & route authorization
        ├── features/         RTK Query API slices (12 domains: users, students, people,
        │                     organizations, stats, payroll, leaves, attendance, classes,
        │                     assignments, announcements, departments)
        ├── lib/api/          axios.ts (Bearer attach + 401→refresh→retry), axiosBaseQuery.ts,
        │                     refresh.ts (single-flight silent refresh)
        ├── lib/store/        authSlice.ts (user persisted in localStorage, token memory-only)
        ├── lib/auth/         bootstrapAuth.ts
        ├── pages/            LoginPage, NotFoundPage
        └── pages/dashboard/  21 dashboard pages
```

---

## 3. Commands

```bash
npm install                 # install all workspaces
npm run dev                 # API (server/nodemon) + UI (vite) together
npm run build               # build server (noop) + client (tsc -b && vite build)
npm run start               # production API server
npm run seed                # ⚠️ BROKEN: runs server/src/utils/seed.js which DOES NOT EXIST

# Server only
cd server && npm run dev            # nodemon server.js
cd server && npm run check          # node --check server.js (syntax)
cd server && npm test               # node --test (⚠️ no test files exist yet)

# Client only
cd client && npm run dev            # vite dev server
cd client && npm run build          # tsc -b && vite build (typechecks!)
cd client && npm run lint           # eslint

# Syntax check any server file
node --check server/src/<path>.js
```

**Ports:** API on `PORT` env (default 5000, `HOST=0.0.0.0`). Client via Vite (5173),
`VITE_API_URL` defaults to `/api` — check `client/vite.config.ts` for a proxy (none
currently configured; set `VITE_API_URL=http://localhost:5000/api` in `client/.env`).

---

## 4. Tech Stack (ACTUAL, verified from package.json + code)

### Backend
| Concern | Tech |
|---|---|
| Runtime | Node.js ≥20, ES Modules (`"type": "module"`) |
| Framework | Express **5** |
| DB | MongoDB via Mongoose 8 |
| Cache/sessions | Redis 6 (optional — `REDIS_REQUIRED=true` to enforce) |
| Auth | JWT access + refresh, httpOnly cookies (`paisa_access`, `paisa_refresh`) + Bearer fallback |
| Password | bcryptjs (12 rounds), lockout after failed attempts |
| Validation | Joi via `validateBody(schema)` middleware |
| Security | helmet, CORS, express-rate-limit, compression, body limits |
| Errors | `ApiError` (statusCode + code), `asyncHandler`, central `errorHandler` |

### Frontend
| Concern | Tech |
|---|---|
| Framework | React **19** + Vite **8**, TypeScript |
| State | Redux Toolkit + **RTK Query** (`createApi` per domain, `axiosBaseQuery`) |
| Routing | react-router-dom **7** (BrowserRouter, guarded `<Routes>`) |
| Styling | Tailwind CSS **v4** (`@tailwindcss/vite` plugin), path alias `@ → src` |
| Icons | lucide-react |

> NOT Next.js. NOT Zustand. NOT React Query. Ignore stale docs claiming otherwise.

---

## 5. Roles & RBAC (current reality)

**11 roles** in `server/src/config/constants.js` (client `roles.ts` still only knows 6 — known gap):

```
super_admin (100) > admin (90) > principal (80) > hr (70) = accountant (70)
> counselor (60) = teacher (60) > support (50) > employee (40) > parent (30) > student (20)
```

- **Permission engine:** `server/src/utils/permissions.js` — `PERMISSIONS` constants
  (`resource:action` strings), per-role maps, hierarchy, and helpers:
  `hasRole`, `hasAnyRole`, `hasAllRoles`, `hasMinimumRole`, `hasPermission`,
  `hasAnyPermission`, `hasAllPermissions`, `canManageRole`, `getUserPermissions`.
  All helpers take a **user object** (reads `user.role` or `user.roles[]`) — NOT a roles array.
- **authorize.js middleware** exports: `requireRole`, `requireAllRoles`,
  `requireMinimumRole`, `requirePermission`, `requireAnyPermission`, `requireAllPermissions`,
  and combined `authorize({ roles, permissions, anyPermissions, minimumRole })`.
  It reads identity from `req.auth` (set by `authenticate.js`) with `req.user` fallback.
- **super_admin** bypasses everything (`hasPermission` short-circuits true).
- **Route guard pattern** (see any route file):
  `router.post("/", authenticate, validateBody(schema), authorize({...}), controller)`

### Auth flow (access + refresh)
1. `POST /api/auth/login` → rate-limited, Joi-validated, audited → returns **accessToken**
   (short-lived, client keeps it **in Redux memory only**) + sets **httpOnly refresh cookie**.
2. Client axios interceptor attaches `Authorization: Bearer <access>` from Redux.
3. On 401 → single-flight `POST /api/auth/refresh` (cookie) → new access token → retry once.
4. Refresh fails → `logout()` → redirect `/login`.
5. `RefreshSession` model + `Device` model back server-side sessions; `/logout` (one) and
   `/logout-all` (all devices).
6. On boot, `bootstrapAuth` silently refreshes to restore the session (user profile is
   persisted in localStorage under `auth-profile`, token never).

### Multi-tenancy
- Tenant key: `instituteId` (ref Organization) on business models + users.
- `authenticate.js` loads user + org, puts `req.user`, `req.auth`, tenant context.
- `tenant.js` resolves/validates target tenant; `domain.js` (`allowDomains`) restricts by
  org type; `ownership.js` (`checkOwnership`) for row-level checks.
- Controller pattern: non-super_admin queries always get
  `query.instituteId = req.user.instituteId`; cross-tenant reads throw `TENANT_ACCESS_DENIED`.
- super_admin may pass `instituteId` explicitly; must never be auto-trusted from body for
  normal users.

---

## 6. API Surface (mounted under `env.API_PREFIX`, default `/api`)

`server/src/routes/index.js` mounts:

| Prefix | File |
|---|---|
| `/auth` | authRoutes — register, login, refresh, logout, logout-all, me |
| `/organizations` | organizationRoutes — CRUD (owner or super_admin for write) |
| `/users` | userRoutes — list/create/get/update/delete (soft) |
| `/hr` | hrRoutes — create HR, list |
| `/employees` | employeeRoutes — create/list |
| `/students` | studentRoutes — create/list |
| `/teachers` | teacherRoutes — create/list |
| `/classes` | classRoutes — CRUD + enroll/remove student |
| `/assignments` | assignmentRoutes — CRUD (role-scoped) |
| `/submissions` | submissionRoutes — list/submit/get/grade |
| `/attendance` | attendanceRoutes — me / list / bulk mark |
| `/study-materials` | studyMaterialRoutes — CRUD |
| `/announcements` | announcementRoutes — list (role-targeted) / CRUD |
| `/payroll` | payrollRoutes — list / process / status / delete |
| `/leaves` | leaveRoutes — list / apply / approve-reject / cancel |
| `/departments` | departmentRoutes — CRUD |
| `/stats` | statsRoutes — per-role dashboards (superadmin/admin/teacher/student/hr/employee) |
| `/` | API root info (version, requestId) |

Response envelope: `{ success, message, data }` / errors via `ApiError` →
`{ success:false, message, code, requestId }`.

Health: `/health`, `/health/live`, `/health/ready` (checks Mongo + Redis).

---

## 7. Data Models (~50 files, `server/src/models/`)

**Identity/tenancy:** `User.js`, `organization.js`, `RefreshSession.js`, `Device.js`,
`counter.js` (userCode sequences: TEA-0001, STU-0042…), `AuditLog.js`

**People profiles:** `student.js`, `teacher.js`, `Employee.js`, `EmployeeDocument.js`

**Academic/LMS:** `Class.js`, `Enrollment.js`, `Assignment.js`, `Submission.js`,
`StudyMaterial.js`, `Test.js`, `Question.js`, `TestAttempt.js`, `LiveSession.js`

**Attendance:** `Attendance.js` (daily, unique `{userId,date,classId}`),
`AttendanceEvent.js` (raw punches), `QRSession.js`, `Geofence.js`, `Device.js`

**HR/Payroll:** `Department.js`, `SalaryStructure.js`, `Payroll.js` (auto `netSalary`,
unique `{employeeId,month,year}`), `Leave.js`, `PerformanceReview.js`, `Certificate.js`

**Comms:** `Announcement.js`, `Event.js`, `Message.js`, `Conversation.js`,
`NotificationLog.js`, `NotificationPreference.js`

**CRM:** `Lead.js`, `Contact.js`, `Customer.js`, `Deal.js`, `Pipeline.js`,
`CRMTask.js`, `CRMNote.js`, `CRMActivity.js`

**Support:** `Ticket.js`, `TicketMessage.js`

**Gamification:** `Achievement.js`, `UserAchievement.js`, `PointLedger.js`,
`Streak.js`, `Leaderboard.js`

**Finance:** `Invoice.js`, `Payment.js`

Conventions: `instituteId` tenant ref, `isDeleted`/soft-delete on major models, static
helper methods + indexes on big models, `select: false` on password hashes, timestamps.

---

## 8. Frontend Conventions

- **Data fetching = RTK Query.** One `createApi` slice per domain in
  `client/src/features/<domain>/<domain>Api.ts` using shared `axiosBaseQuery`.
  Pattern: `tagTypes` + `providesTags`/`invalidatesTags` for cache invalidation;
  `transformResponse: (res) => res?.data ?? res` to unwrap the envelope.
- **Auth state:** Redux `authSlice` — `user` (persisted localStorage) + `token`
  (memory only). Actions: `setAuth`, `setToken`, `logout`.
- **Routing:** all protected pages under `<AuthGuard > <RoleGuard > <DashboardLayout>`.
  Add a page in 3 places: page component, `AppRouter.tsx` route, and
  `config/roles.ts` `NAV_SECTIONS` (nav visibility + RoleGuard authorization both come
  from `allowedPathsForRole`).
- **UI kit:** `components/ui/` — button, badge, Modal, PageHeader, StatCard, StateViews
  (loading/error/empty). Tailwind v4 classes, `lucide-react` icons.
- **Env:** `VITE_API_URL` (default `/api`).

---

## 9. Coding Conventions (server)

- Vertical-style formatting: one argument per line in many files — match surrounding style.
- Controllers use `asyncHandler` + throw `ApiError.xxx(message, CODE)`.
- Validation: Joi schemas in `validators/`, applied via `validateBody` in routes.
- Audit: `auditMiddleware({ action, category, resource, description })` on sensitive routes.
- Tenant scoping inside controllers (see §5) — never trust client `instituteId`.
- Route order: `authenticate → rateLimiter → validateBody → audit → authorize → handler`.
- Always `node --check <file>` after editing server files (no tsc on server).

---

## 10.5 AUTH CONTRACT (fixed 2026-09-29 — read before touching auth)

**Login/refresh response body (both endpoints):**
```json
{ "success": true, "data": { "user": {...}, "accessToken": "<jwt>", "expiresAt": "...", "sessionId": "..." } }
```
- Client keeps `accessToken` in **Redux memory only** (never localStorage).
- Refresh token: httpOnly cookie `paisa_refresh_token` (+ `paisa_access_token` also set).
- 401 anywhere → axios interceptor single-flight `POST /auth/refresh` → retry once → else logout.
- **Refresh token rotation:** the refresh JWT is a signed token whose payload includes
  `tokenHash` = sha256 of the random session secret. `refreshSession` compares the JWT's
  `tokenHash` CLAIM against the DB `RefreshSession.tokenHash` — never hash the JWT string.
- Revocation uses the schema's real fields: `revokedAt` / `revokedReason` (via instance
  `.revoke(reason)` and statics `.revokeUserSessions(userId, reason)` / `.revokeFamily(familyId, reason)`).
  There is NO `revoked` boolean or `revocationReason` field — setting those silently no-ops.
- Rotation must go through `session.rotate(newTokenHash, newExpiresAt)` (archives `previousHash`).
- Session record client fields: `ip` (NOT `ipAddress`), `userAgent`.

**publicId convention (all resources):**
- Every model has an immutable unique `publicId` (e.g. `user_<base64url>`, `org_<base64url>`).
- Client URLs and mutations use `publicId` — helper `rid(record)` in
  `client/src/features/users/usersApi.ts` returns `record.publicId ?? record._id`.
- Server `:publicId` route params query `findOne({ publicId })` (already the pattern).
- Reference fields in bodies (`teacherId`, `studentId`, `employeeId`, `head`, `classId`,
  `userId`) carry publicIds; controllers resolve them via
  `resolveRef(Model, ref, { label })` from `server/src/utils/resolveRef.js`
  (ObjectId-shaped values pass through; anything else is looked up, 404 on miss).
- `authenticate.js` exposes `req.auth.publicId`; `sanitizeUser` keeps `publicId` in
  login/refresh/me responses so the client has it in `auth.user`.



1. **RESOLVED 2026-09-29:** `authorize.js` now consistently passes `req.user` (not role
   arrays) into all `has*` helpers from permissions.js, with clean formatting. Auth flow
   bugs fixed in `authService.js` (tokenHash claim compare, revokedAt fields, rotate(),
   ip field) and `authController.js` (accessToken in body). publicId identity layer added
   (`resolveRef.js` + client `rid()` + all pages/slices migrated).
2. **Client/server role mismatch:** client `roles.ts` supports only 6 roles
   (super_admin, admin, teacher, student, hr, employee); server supports 11 (adds
   principal, accountant, counselor, parent, support). New roles have no UI/nav.
3. **`npm run seed` is broken** — `server/src/utils/seed.js` referenced by script does not exist.
4. **No tests exist** despite `node --test` configured; no test files found anywhere.
5. **Stale docs:** README.md, PROJECT.txt (Next.js/Zustand-era), structure.txt partially
   stale. `kya vishye.md` is the best spec but partially aspirational (some models/routes
   for CRM, tickets, gamification, tests exist as models but have **no routes/controllers yet**).
6. **Models without routes yet** (built, not exposed): Tests/Questions/Attempts,
   Enrollment, LiveSession, CRM suite, Tickets, Gamification, Invoices/Payments,
   PerformanceReview, Certificate, SalaryStructure, EmployeeDocument, Notifications,
   Events, Messages/Conversations, QR/Geofence/Device flows.
7. **No Vite proxy** — client relies on `VITE_API_URL` being absolute in dev, or a
   same-host `/api` in production.
8. **Git hygiene:** recent commit messages are noise ("hmm", "fffffffffffffffffff");
   repo has ~26 commits, 3 human contributors, no PR flow.

---

## 11. How To Work In This Repo (playbook)

**Add a backend resource:**
1. Model in `server/src/models/` (with `instituteId`, timestamps, indexes).
2. Controller with `asyncHandler` + `ApiError` + tenant scoping.
3. Joi schema in `validators/` if body input.
4. Routes with full chain: `authenticate, validateBody, auditMiddleware, authorize`.
5. Mount in `routes/index.js`.
6. `node --check` every touched file.

**Add a frontend page:**
1. `pages/dashboard/XPage.tsx` using ui kit + StateViews.
2. RTK Query slice in `features/x/xApi.ts` (or extend existing).
3. Route in `AppRouter.tsx` inside the guarded layout.
4. Nav entry + roles in `config/roles.ts`.

**Debugging auth:** check cookies `paisa_access`/`paisa_refresh`, then
`authService.js` (token mint/verify) and `RefreshSession` records; client-side trace is
axios.ts interceptors → refresh.ts → authSlice.

**Before finishing any change:** typecheck client (`cd client && npx tsc -b --noEmit` or
`npm run build`), `node --check` changed server files, and manually exercise the affected
endpoint via dev server — there are no automated tests to rely on.
