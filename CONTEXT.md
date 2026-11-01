# PROJECT CONTEXT — the ONLY context file (read this FIRST in every session)

> **RULE FOR AI ASSISTANTS:** Read this file before doing anything. After every
> session — no matter how small — **update this file**: tick finished Backlog
> items, record new decisions/gaps, and prepend an entry to the Session Log (§12).
> Never redo a full project analysis if this file already has the answer.
> This file replaced SKILL.md, IMPROVEMENTS.md, structure.txt, `kya vishye.md`
> and client/README.md (2026-10-27). They are still in git history if needed
> (`git show 60cb432:"kya vishye.md"` = the 5,270-line aspirational product spec).

Last updated: 2026-10-29

---

## 0. CURRENT STATUS & COMPLETION PLAN (live: keep this section current every session)

**Goal set by the owner (2026-10-29): make the project 100% complete.** That means every role can do its
job end to end, every feature in §8c is built, and the integrations below are live.
Work is done in waves; each wave is verified (tests, lint, build, live API calls) and then committed.

### Reports (where to look)
- **Per-role report** → §8b: pages, actions, ~% done, and what's left per role.
- **Per-feature report** → §8c: UI-route coverage, ~depth %, and what's missing per feature.
- **Known bugs** → §9. **Ordered backlog** → §11. **History** → §12.
- How these were measured (2026-11-01): route gates for 252 routes × 11 roles, client nav → hooks → endpoints,
  and 484 live GETs as every demo user in both orgs. Method in §8b; scripts are in the session scratchpad only.

### Snapshot (2026-11-01, after Wave 5)
- Health: 39/39 unit tests, client lint + build, e2e:smoke 171/171, e2e:flows 39/39, e2e:tenant 671/671 (0
  leaks), 484 live page-load GETs across both demo orgs with 0 real failures.
- Roles ~72–88% done (§8b); features 55–88% (§8c). What keeps it below 100%: the D7/D8 chat-permission decision,
  small ownership gaps (D13–D15), payroll proration/formula components, real Razorpay/Resend runs (need keys),
  and not-built items (2FA/session list, SMS/push, scheduled jobs, AI, i18n).

### Decisions (owner, 2026-10-29)
| Area | Decision |
|---|---|
| Payments | **Razorpay**, built as if keys exist (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` in server/.env) |
| Email | **Resend API** (`RESEND_API_KEY`, `EMAIL_FROM`); log to console when unset |
| File storage | **Local disk now, S3-ready** adapter (`STORAGE_PROVIDER=local`, `STORAGE_PATH=./uploads`) |
| Commits | **One verified commit per wave** on `feature/roles-polaris`; never push without asking |
| Defaults (not asked) | Live video = Jitsi meeting links (no key) · realtime = socket.io · AI features only when an API key is set |

### Waves
- **Wave 1: bugs** ✅ committed `3fe1187`: B4 grading 403, B5 counselor class picker, B6 profile/password 404,
  plus `GET /auth/me` 500.
- **Wave 2: UI for existing APIs (U1)** ✅ done 2026-10-29 (committed, see §12):
  - [x] CRM pipelines tab (`components/platform-ui/PipelinesPanel.tsx`), event edit, announcement edit,
    achievement edit + points ledger, payroll delete, geofence edit, notification broadcast
    (`components/comms/BroadcastNotificationModal.tsx`).
  - [x] Messages: edit/delete own messages, add participants + leave (group chats).
  - [x] Learning: submission grading modal (`components/learning/SubmissionsGradingModal.tsx`), edit assignment,
    edit material, edit question; B7 + B8 fixed.
  - [x] Platform: super_admin org list + create (shows one-time admin temp password) + delete (soft); user delete
    (= deactivate) for super_admin/admin (`components/platform-admin/`).
  - [x] Ticket delete, salary-structure edit, review/certificate delete.
- **Wave 3: features with no outside service** 🔄 part 1 committed 2026-10-31 (see §12):
  - [x] CRM activities/tasks/notes (`/api/crm-activities|crm-tasks|crm-notes`, Tasks tab + lead/deal timeline).
  - [x] Leave policies + balances (`LeavePolicy`, `LeaveBalance`, `services/leaveBalanceService.js`), half-day,
    overlap check; payroll generate/preview from assigned salary structure + attendance + leave
    (`services/payrollCalculator.js`), payslip print, salary-structure assignment per employee.
  - [x] Ticket SLA (`TICKET_SLA_HOURS`, `slaState`), first response time, internal notes, reply templates
    (`TicketTemplate`); certificate print + public `GET /api/public/certificates/:code` + `/verify/:code` page.
  - [x] CSV / print-PDF export (`lib/export`, `ExportMenu`, gated by `report:export`) on Reports, Users, Students,
    Employees, Attendance, Invoices, Audit log (H5); employee lifecycle stages + history + checklists.
  - [x] Part 2 (committed 2026-11-01): H1 finished (no `requireRole` left in routes; per-role gate diff proved
    unchanged access), H3 Joi validation on every write route (`validators/*`, `validators/common.js` `body()`;
    bad input → **422** `VALIDATION_ERROR`, unknown keys kept, authorize runs before validation), H2
    `npm run e2e:tenant` (two demo orgs, 671 checks, 0 leaks), rich idempotent seed (`server/src/utils/seed/`,
    second org "Demo Company Two" `<role>@demo2.paisa.test` for admin/hr/accountant/support/employee),
    `npm run seed:report`.
  - Still open: mid-month joiners not prorated; formula salary components count as 0; `models/CRMNote.js` is a
    copy of CRMTask (notes are stored as `CRMActivity` type `note`) — delete it; counselors may delete only their
    own CRM tasks/activities/notes (delete routes accept `:create` holders, controller limits to creator);
    organizations drop top-level `website`/`logo` (model keeps them under `branding`); study-material update
    with `type: ""` passes validation then fails in the model; `ApiError.notFound(msg, "CODE")` string-code
    calls (G9) still lose their codes; teacher/student/enrollment creates not covered live in the tenant suite.
  - Fixed in part 2: payslips for teacher/counselor/support (`payroll:read` + nav), self-service leave for
    accountant/counselor/support (leave list = own unless approver), hr `salary_structure:delete`.
- **Wave 4: integrations**:
  - [x] Payments module (committed separately 2026-10-29, verified live; see §12): Payment model, manual payments with receipts,
    refunds, Razorpay order/verify/webhook, client Pay online + payment history + printable receipts.
  - [x] Billing subscriptions (F4, 2026-11-01): `config/plans.js` (free / starter ₹999 / pro ₹2,499 / enterprise
    ₹9,999 per month, yearly = 10×; user/student/storage limits), `Subscription` model + `services/subscriptionService.js`,
    `/api/subscriptions` (plans, current, checkout → Razorpay order, verify, cancel/resume, super_admin override with
    audit), webhook routes subscription orders (idempotent), lazy expiry (7-day past_due grace → free), seat limit →
    403 `PLAN_LIMIT_REACHED` in createUser/createEmployee. BillingPage rewritten; override panel on org detail.
    Gated by `finance:read|manage` (principal: read-only page, 403 on API). Gaps: legacy `PUT /organizations` `plan`
    still bypasses the Subscription record; HR/teacher creation not seat-checked; real checkout untested (no keys).
  - [x] Email via Resend (2026-11-01): `services/emailService.js` (fetch to Resend; logs instead of sending when
    `RESEND_API_KEY` is unset; never throws), templates, forgot/reset password (`/auth/forgot-password` always
    200 + same message; sha256 single-use token, `PASSWORD_RESET_TTL_SECONDS` default 15 min; reset revokes all
    sessions), welcome email with a set-password link (passwords are never emailed), invoice issued (student +
    linked parents / employee), leave decision, payslip ready, notification broadcast `channels: ["email"]` —
    all respect notification preferences. Client: `/forgot-password`, `/reset-password`.
  - [x] File uploads (2026-11-01): `services/storage/` (local disk under `STORAGE_PATH`, per-tenant folders, random
    names, allow-listed types + magic-byte check, `MAX_FILE_SIZE_MB`; S3 adapter is a documented stub), `File`
    model, `/api/files` (multer memory, upload → `fileId`; download streams as attachment + nosniff, authorised by
    the linked record's rules; delete removes bytes). Employee documents, study materials and submissions accept
    `fileId` (links still work). Client `components/ui/FileUpload.tsx` + `lib/api/files.ts`. Gaps: orphaned uploads
    and files of deleted materials are not cleaned up; S3 not implemented.
  - [x] Live video (2026-11-01): sessions without a link get `https://${JITSI_DOMAIN}/<unguessable slug>`; embedded
    `JitsiMeetingModal` (external_api.js) with the user's name; `POST /live-sessions/:id/join` records attendance,
    `GET /:id/participants` host-only; access by accessMode + class membership (private/invite-only hidden).
  - [x] Realtime (2026-11-01): `server/src/realtime/` (socket.io 4.8.3 on the http server, handshake mirrors
    authenticate.js, rooms `user:` / `org:` / `conv:` (participant-checked), throttled typing, `auth_error` on expiry),
    emits from messageController + notificationController; client `lib/realtime/` (connect with the in-memory token,
    refresh + reconnect, RTK cache sync, typing label), Vite `/socket.io` proxy. Gaps: logout-all doesn't kick live
    sockets (they drop at token expiry ≤15 min); multi-process needs a socket.io Redis adapter.
  - [ ] Optional AI features (only when an API key is set).
- **Wave 5: final pass** ✅ 2026-11-01: fresh audit (§8b/§8c), D1–D6 + D9–D12 fixed, known gaps closed (plan
  bypass, seat checks, socket kick on revoke, duplicate models, org website/logo, material type, material file
  cleanup, G9). **Next (needs owner input):** D7/D8 chat permissions; then D13–D15, payroll proration/formula
  components, real Razorpay/Resend runs with keys, and the not-built items in §8c.

### Cleanup owed
- Test data left in the shared demo DB by the stopped Learning agent: assignment `ass_NV53mA67ZH71onHj6-hzeA`
  ("UI-AGENT grading test") with one student submission. There's also a ₹1000 test invoice for the demo student
  with 2 payments and 1 refund (payments test). Keep it as demo data, or delete it.

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
npm run seed             # demo org + one user per role (<role>@demo.paisa.test, pw Paisa@Demo1 or SEED_PASSWORD)
                         #   plus rich demo data and a 2nd org (<role>@demo2.paisa.test); idempotent, safe to re-run
                         #   -- --dry-run validates only (no DB), -- --reset recreates; refuses in production
npm --prefix server run seed:report   # record counts per collection for both demo orgs
npm --prefix server run e2e:smoke     # every role's page loads (needs the API running)
npm --prefix server run e2e:flows     # end-to-end flows (check-in steps SKIP after the first run of the day)
npm --prefix server run e2e:tenant    # cross-org isolation suite (two demo orgs)

cd server && npm run check   # node --check server.js (entry file only)
cd server && npm test        # node --test → finds 0 test files today
cd client && npm run lint    # eslint
cd client && npm run build   # tsc -b + vite build = the client typecheck
```

- Vite proxies `/api` → `VITE_API_PROXY_TARGET` (default `http://127.0.0.1:5000`).
  Leave `VITE_API_URL` unset in dev so refresh cookies stay same-origin.
- `server/.env` exists locally (git-ignored). No `client/.env` needed in dev.
- **Environment (this machine):** the default `node` is now **v24.21.0** (nvm current), so plain `node`/`npm`
  work. It used to be v12 (can't parse `?.`); if `node -v` shows v12 again, run `nvm use 22.14.0`.
- **Dependencies:** this is an npm-workspaces repo. Add packages from the root (`npm install <pkg>@<ver> -w client`
  / `-w server`), never with `npm --prefix client install` — that creates nested `node_modules` that shadow the root.
- **Agents: avoid permission prompts.** Do NOT prefix commands with `PATH=…`/`export PATH=…`, do NOT edit files via
  `python - <<EOF`/`sed -i`, and avoid `cd … && … | …; …` chains: Claude Code asks for approval on these even in
  bypass mode. Edit with the Edit/Write tools, search with Grep, and run single commands with absolute paths
  (e.g. `npm --prefix D:/paisa/client run lint`, `node --check D:/paisa/server/src/x.js`).
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
| Attendance | ✅ | geofence check-in + class codes done (2026-10-29); ❌ device/biometric kiosk (Device model + perms, no routes/UI); class code is typed, no QR image/scan |
| Leaves, Payroll | ✅ | |
| Messages, Announcements, Events, Notifications | ✅ | |
| Invoices + payments | ✅ | |
| Billing | 🟡 | plan change via `updateOrganization`; no payment/subscription engine |
| CRM leads/deals/pipelines | ✅ | ❌ Contact & Customer models have no routes/UI |
| Tickets, Gamification, Settings | ✅ | |
| Reports | ✅ | variants for all 8 nav roles + server `/stats/{accountant,counselor,support}` |
| Employee documents | ❌ | model + `employee_document:*` perms only |
| Audit log viewer | ❌ | `AuditLog` written by audit middleware; no read API/UI |

## 8b. Per-role completeness (re-audited 2026-11-01, after Wave 5 fixes)

Method (Wave 5 audit agent, read-only): the real routers were loaded and every gate run for each role (**252
routes × 11 roles = 2,772 cells**, none undecided); client vs server permission matrices compared (270 perms ×
11 roles, no drift); client nav → pages → RTK hooks/axios → route → verdict (231 endpoints, none pointing at a
missing route; 228/252 routes called by some page); then **484 live page-load GETs** as every demo user in both
orgs (0 real failures — the 19 non-200s were queries the page skips for that role or calls with params) plus ~75
cross-org probes (no leaks). "~Done" = judged against the role's intended scope; an estimate, not a measurement.
Percentages below include the Wave 5 fixes (D1–D6, D9–D12).

| Role | Pages | Actions | ~Done | Left (biggest first) |
|---|---|---|---|---|
| super_admin | 10 | 29 | 75% | No session list / 2FA · Companies/Institutes read-only (F5) |
| admin | 29 | 146 | 88% | CRM activity/note edit UI (D15) · Razorpay + Resend untested without keys · no restore of other soft-deleted records |
| principal | 28 | 62 | 80% | No Billing (lacks `finance:read`, by design) · can't delete assignments/materials (D13) |
| teacher | 19 | 52 | 80% | Can't delete own tests/questions or edit own events (D13) · can't add/leave group chats (D7) · no rubrics/proctoring |
| student | 17 | 26 | 80% | Can't start a chat (D8) · online pay untested (no keys) |
| hr | 15 | 55 | 80% | Payroll proration for mid-month joiners · formula salary components count as 0 · D7 |
| accountant | 9 | 29 | 72% | Can't mark payroll paid (D14) · reports are stat cards + CSV · can't start a chat (D8) |
| counselor | 12 | 47 | 78% | Can't delete leads/deals (D14) · no CRM activity/note edit (D15) · no lead scoring/duplicate check |
| support | 8 | 22 | 78% | Customers read-only (D14) · no ticket merge |
| employee | 11 | 20 | 75% | Can't upload own documents or acknowledge a review (D14) · can't start a chat (D8) |
| parent | 14 | 20 | 75% | Can't start a chat (D8) · read-mostly by design |

Open audit items (2026-11-01): **D7/D8 need an owner decision** — who may start chats / edit own messages /
add-leave groups (today only admin, counselor, support; students, parents, employees and accountants have no
New Chat). D13 owners can't edit/delete what they create in a few modules (events, achievements, own
tests/questions, principal assignments/materials). D14 narrow per-role gaps listed above. D15 no edit UI for CRM
activities/notes (PUT routes exist). D16 tenant-suite test accounts stay as inactive users (no hard-delete API).
Audit scripts + JSON: session scratchpad `audit/` (not in the repo).

## 8c. Feature depth (re-audited 2026-11-01, after Wave 5 fixes)

"UI routes" = routes some client page calls / routes in that module. ~Depth is judged against the spec; an estimate.

| Feature | UI routes | ~Depth | Missing |
|---|---|---|---|
| Auth & sessions | 3/9 + login/forgot/reset pages | 80% | No 2FA or session list |
| Organizations / tenancy | 6/6 | 80% | Companies/Institutes read-only (F5) |
| Users & RBAC | 5/6 | 85% | Non-managers get a directory view only (D1 fixed) |
| Audit log | 1/1 | 85% | Integrity hashes |
| Notifications | 7/7 | 75% | No SMS/push (email via Resend, realtime bell) |
| Classes & enrollments | 6/7 + 4/4 | 85% | — |
| Assignments & submissions | 4/5 + 3/4 | 80% | No rubrics / peer review |
| Tests / questions / attempts | 5/5 + 4/4 + 4/4 | 78% | Teacher can't delete own (D13) · no proctoring |
| Study materials | 4/4 | 85% | Abandoned (never-attached) uploads not cleaned up |
| Live sessions | 6/7 | 75% | No recording (Jitsi embed + attendance done) |
| Attendance | 5/5 | 75% | Device kiosk · QR image (class registers + org records view done) |
| Certificates | 4/4 + public verify | 80% | Templates |
| People | 17/20 | 88% | — |
| Departments | 4/4 | 88% | — |
| Leaves | 11/11 | 85% | Attendance sync not verified |
| Payroll | 9/9 | 72% | Proration · formula components · accountant "paid" step |
| Salary structures / reviews | 8/8 | 70% | No acknowledge · no goals/PIP |
| Employee documents | 4/4 | 78% | No employee self-upload |
| Invoices & payments | 5/6 + 6/7 | 80% | Real checkout untested · no reconciliation |
| Billing / subscriptions | 7/7 | 75% | Real checkout untested |
| CRM leads/deals/contacts/customers | 4/5 + 4/4 + 4/4 + 4/4 | 78% | No scoring / duplicate check |
| CRM pipelines | 3/3 | 70% | No pipeline edit route |
| CRM activities/tasks/notes | 3/4 + 5/5 + 3/4 | 72% | No activity/note edit UI (D15) |
| Messaging | 8/9 + 2/2 | 70% | D7/D8 (owner decision) |
| Announcements / events | 4/5 + 4/5 | 75% | D13 |
| Tickets | 11/11 | 82% | No merge |
| Gamification | 9/9 | 55% | Leaderboard empty for demo users · Streak/Leaderboard models unused |
| Reports | 9/9 | 55% | Stat cards + CSV/print only |
| Files | 3/3 | 78% | S3 adapter is a stub |

Not built anywhere: scheduled jobs, SMS/push, i18n, QR image, AI features. Unused models: Device,
AttendanceEvent, Streak, Leaderboard (CRMNote.js and the stray Invoice.js were deleted 2026-11-01).

### Previous audit (2026-10-27, superseded)

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
- **B4 🟠 Teachers/principals cannot grade test attempts.** `PUT /attempts/:id/grade` (testRoutes.js) requires
  `test_attempt:update|manage`. Teachers and principals hold neither, but students do (for submit), so the gate
  lets students through (blocked later in the controller) and rejects teachers. The controller even has a
  teacher-owns-test branch that is unreachable. Live probe: teacher 403, principal 403, admin 404.
- **B6 🟠 Profile update and password change are broken for every role.** SettingsPage.tsx calls
  `PUT /auth/profile` (lines 40, 51); authRoutes.js has no such route, so both return 404.
- **B5 🟡 Counselor enrollment form has an empty class dropdown.** EnrollmentsPage fetches `/classes` when
  `canManage`, but counselor lacks `class:read` → 403 → enrollments can only be created without a class.
- **B7 🟠 (fixed 2026-10-29, uncommitted) Students could not submit assignments.** `submitAssignment` used
  `findById(publicId)` and omitted `instituteId`. Submission lists also leaked to parent/hr. Fixed in
  submissionController.js.
- **B8 🟠 Creating any study material fails.** The client sends a class publicId, which fails to cast to ObjectId;
  without a class, the default `visibility: class_only` rejects it. Same raw `classId` problem in update and list
  filter. Fix: `resolveRef(Class, …)` + visibility `institute` when no class.
- **B9 (fixed 2026-10-29, uncommitted)** Manual payments never stored history (`invoice.payments` isn't in the
  schema) and partial payments set the invalid status `"partial"`. Replaced by the Payment model + paymentService.
- ~~**G8**~~ (fixed 2026-11-01: stray `models/Invoice.js` and the duplicate `models/CRMNote.js` deleted.) Unused
  models remain: Device, AttendanceEvent, Streak, Leaderboard.
- ~~**G9**~~ (fixed 2026-11-01: ApiError factories accept a bare string as the code, so `ApiError.notFound(msg,
  "CODE")` keeps "CODE"; `sendError` derives a code from the status when none is given.)
- **G10** Client typecheck: use `npx tsc -p tsconfig.json --noEmit`. `tsconfig.app.json` lacks the `@/*` alias and
  gives bogus "Cannot find module" errors.
- **G3** Two gating styles (§7) can drift. Long-term: migrate to permission-based.
- **G4** Seed script added 2026-10-29 (`server/src/utils/seed.js`); its dry run validates, but saving against a real MongoDB is still unverified. Server has 17 pure-function tests; no DB or client tests.
- **G5** Only `authValidator.js` exists. Most write routes have no Joi validation, so check mass-assignment on create/update controllers.
- ~~**G6**~~ (resolved: `client/tsconfig.tsbuildinfo` untracked, `*.tsbuildinfo` git-ignored)
- ~~**G7**~~ (fixed 2026-10-29: root package renamed `paisa`)

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
- [x] R1. (done 2026-10-28, uncommitted) Principal: allow on classes/assignments/teachers/payroll GET (+ salary read) — fixes 5 load-403 pages.
- [x] R2. (done 2026-10-28) Accountant: payroll GET + invoice Send/Cancel actions.
- [x] R3. (done 2026-10-28: self-service perms granted to every role) X1 notification-preference perms for all roles (Settings page).
- [x] R4. (done 2026-10-28) X2 ticket replies for requesters; align hr staff status.
- [x] R5. (done 2026-10-28: TakeTestModal + My Results tab; answer key stripped server-side) Student test-taking UI (start → answer → submit) using existing endpoints.
- [x] R6. (done 2026-10-28) HR: teachers read + certificates read; events delete alignment.
- [x] R7. (done 2026-10-29 except Messages, Tickets staff list, UserDetail and Enrollments super_admin-only delete, which mirror server constants; all other pages use usePermission) X3 replace hard-coded role arrays in pages with `<Can>`/`usePermission`.
- [x] R8. (done 2026-10-28) X5 dedupe nav; counselor Enrollments nav; Gamification nav for admin/employee.

**P1b — correctness of shipped features**
- [x] G2. (done 2026-10-28: Student.guardianUserIds + utils/parentScope.js; scoped classes/assignments/tests/invoices/attendance; parent picker in Students edit modal) Parent↔child link on the student profile + scope parent queries to their children.
- [x] B4. (done 2026-10-29: grade gate = test_attempt:manage|test:manage|test:update; principal gets test_attempt:read) Let teachers (own tests) and principals grade attempts: grant/gate by a grading permission, not `test_attempt:update`.
- [x] B6. (done 2026-10-29; also fixed `GET /auth/me`, which 500ed because authService default export lacked sanitizeUser) Add `PUT /auth/profile` (name/phone + password change with currentPassword check, revoke other sessions).
- [x] B5. (done 2026-10-29: counselor gets class:read) Counselor enrollment class picker: grant `class:read` or expose a lightweight class list.
- [x] U1. (done 2026-10-29, Wave 2) Missing UIs on existing APIs: submission grading, org create/delete, user delete, pipelines, edit forms (assignments/materials/questions/events/salary structures/geofences), notification broadcast.
- [x] B8. (done 2026-10-29) Study material create/update/filter with class publicIds (see §9).
- [x] B10. (done 2026-10-29) Students/parents see institute/public materials + class-only materials of their (children's) classes only.
- [x] O1. (done 2026-10-29) Org list total excludes deleted; super_admin "Deleted" view + `POST /organizations/:id/restore`; detail page fetches `GET /organizations/:id`. Users are intentionally NOT deactivated on org delete: `authenticate` rejects members of a deleted org on every request, so restore brings them straight back.
- [x] T1. (done 2026-10-29) Ticket assignee picker in the ticket drawer + "Assigned to" column; `GET /tickets/:id/assignees` (admin/hr/support of the ticket's org); assigning a non-staff user → 400.
- [~] P1. (payments module done 2026-10-29, uncommitted) Razorpay payments, receipts, refunds. Needs live keys to test checkout.
- [ ] F4. Billing: real subscription/payment flow (decided: Razorpay, see §0).
- [ ] F5. Companies/Institutes: proper management views, or fold them into Organizations filters.

**P2 — models + permissions with zero implementation**
- [x] M1. (done 2026-10-28: /api/employee-documents + Documents tab in HR Ops; metadata + optional file link, no binary upload) Employee documents.
- [x] M2. (done 2026-10-29: geofence CRUD, geofence-checked staff check-in/out, 8-char class codes for students; device/biometric kiosk NOT built) Geofence / QR session / device attendance.
- [x] M3. (done 2026-10-28: GET /api/audit-logs + AuditLogPage) Audit log viewer (`audit:read`, super_admin/admin).
- [x] M4. (done 2026-10-28: /api/contacts, /api/customers + CRM tabs; create/list/delete only, no edit form) CRM Contacts & Customers.

**P3 — hardening**
- [x] H1. (done 2026-11-01: no `requireRole` left in any route; new perms `stats:<role>`, `attendance:mark|scan`) Migrate `requireRole` routes to permission-based gating.
- [x] H2. (done 2026-11-01: 25 unit tests + `npm run e2e:tenant` live cross-org suite, 671 checks, 0 leaks; still no client tests) Tests: server `node --test` for auth/tenant isolation first, then client.
- [x] H3. (done 2026-11-01: Joi on every POST/PUT/PATCH, 422 on bad input) Joi validators for write routes (G5).
- [x] H4. (done 2026-11-01: rich idempotent demo data for two orgs, verified real run + re-run creates 0) Working seed script.
- [x] H5. (done 2026-10-31: client-side CSV + print-PDF via `ExportMenu`, gated by `report:export`) Verify `report:export` flow.

Done (from the 2026-10-25 backlog, in commit 60cb432): B1 parent access to classes/
assignments · B2 Reports for all nav roles · B3 nav/permission reconciliation (leaves for
teacher+student, announcements for counselor) · F1 Students CRUD · F2 Employees CRUD · F3 HR panel CRUD.

## 12. Session log (newest first)

- **2026-11-01 — Wave 5: audit + final fixes.** One read-only audit agent (gates for 252 routes × 11 roles, client
  map, 484 live GETs, cross-org probes) while known gaps were fixed in this session. Fixed: **D1 (high) every role
  could read every org user's full record** (phone, address, DOB, employment, last-login IP) — `GET /users` now
  returns a directory view (publicId, name, email, role, userCode, status, avatar) unless the caller holds
  `user:update|user:manage`, and `GET /users/:id[/detail]` is manager-or-self; D2 unescaped search regex → 500 on
  9 lists (escaped everywhere); D3 Teachers "Add" shown to hr (now `teacher:create`); D4 parents see children's
  submissions and the by-id submission route now checks student/parent/teacher-owner/grader (it was open to any
  same-org user); D5 HR/principal get an org attendance records view; D6 the mark sheet picks a register (class
  roster or staff), sends `classId` and prefills saved marks; D9 Classes page uses permissions, principal may
  reassign a teacher; D10/D11 Billing nav: super_admin added, principal removed; D12/G9 error codes. Known gaps:
  `PUT /organizations` refuses plan changes (use the subscription), website/logo saved under `branding`, HR
  creation seat-checked, logout-all / password reset / account disable kick live sockets (`emit.disconnectUser`),
  deleted duplicate models, material `type: ""` on update → 422, deleting a material removes its stored file.
  Verified: wave5 live 33/33, unit 39/39, client lint + build, smoke 171/171, flows 39/39, tenant 671/671 (0 leaks),
  subscriptions 45/45, realtime 31/31, files 49/49, email 24/24, part-2 18/18, leave/payroll 45/45, CRM 29/29,
  tickets/certs 21/21, invoices 6/6. Still open: D7/D8 (owner decision), D13–D15, payroll proration/formula.

- **2026-11-01 — Wave 4 round 2: subscriptions + Jitsi, realtime.** Two agents. Verified on the combined tree:
  39/39 unit tests (plans + realtime emitter tests added), client lint + build, e2e:smoke 171/171, e2e:flows 39/39
  (+3 once-per-day skips), e2e:tenant 671/671 (0 leaks), subscriptions/Jitsi live 45/45 (demo org restored to free),
  realtime live 31/31, signed-webhook activation 15/15 (in-process with a test secret; no real Razorpay keys).
  **Workspace install fix:** the agents ran `npm install` inside `client/`/`server/`, which created a nested
  `client/node_modules` whose Vite 8.0.14 shadowed the root 8.3.0 and left `socket.io-client` out of the root lock —
  restored `client/package-lock.json` and re-ran `npm install` at the root (345 nested duplicates removed). **Rule:
  add dependencies from the root with `npm install <pkg>@<ver> -w client` (or `-w server`).** Also: a Karpathy-
  guidelines `UserPromptSubmit` hook was added to `.claude/settings.local.json` and the rule to AGENTS.md.
  Leftover demo rows: two empty "REALTIME-AGENT test" groups (no delete API), broadcast notifications for org-1
  teachers, subscription history entries. Not tested: real Razorpay checkout, browser UI.

- **2026-11-01 — Wave 4 round 1: email + file uploads.** Two agents in parallel (cap of 2 to stay under usage
  limits). Env keys for S3 and `JITSI_DOMAIN` added up front so agents didn't share env.js. Verified on the
  combined tree: 30/30 unit tests (5 new storage tests), client lint + build, e2e:smoke 171/171, e2e:tenant
  671/671 (0 leaks), files live 49/49 (owner/manager download, cross-class/cross-org 403/404, .exe/MIME/magic/
  oversize rejected, traversal names sanitised, delete removes bytes), email live 24/24 (no enumeration, token
  single-use, sessions revoked, demo password restored; leave/invoice/broadcast emails logged). `multer@2.0.2`
  added (lockfile format upgraded). Leftover demo rows: two test submissions (no delete API). Not tested: real
  Resend delivery (no key), browser UI.

- **2026-11-01 — Wave 3 part 2 (hardening).** Four agents (people routes H1+H3 · ops routes H1+H3+perms ·
  validators for all other routes · tenant suite + seed); one usage-limit stop, resumed. Then fixed directly:
  **`resolveRef` returned raw ObjectIds without checking `scope`** (every tenant-scoped lookup could be bypassed
  with a 24-hex id) — now enforced; 5 cross-org create/link leaks found by `e2e:tenant` (class enroll + teacherId
  on create/update, test questionIds/classId, payroll employeeId, invoice studentId/employeeId) plus enrollment
  create, attendance mark/filter, test/attempt/enrollment list filters — all scoped to the record's org; parents
  now see only their children's enrollments; a student's `?classId=` no longer widens the tests list. Bugs fixed:
  live sessions could never be created (`createdBy` missing; `class` access without a class; `completed` →
  model's `ended`; class publicIds not resolved); calendar events could never be created (controller used the
  domain-event outbox `models/Event.js`) — new `models/CalendarEvent.js`; invoices lost line items (`lineItems`/
  `subTotal` vs model `items`/`subtotal`) and got no number — now `INV-YYYY-NNNNN` per org, `lineItems` returned;
  tests wrote `schedule`/`totalPoints` (model: `scheduling`/`grading.maxScore`), `passingScore` is a percentage →
  `grading.passingPercentage`, grading recomputes `passed`; deals list 500 (`isConverted` virtual on partial
  populate); department head errors were 500; enrollment create always failed (`createdBy`); employee-code
  collision on first stage change; hr unknown id 500; teacher form fields; review type `semi_annual`. Validation
  status unified at 422. `e2e-flows` now SKIPs once-per-day check-in steps instead of failing. Verified live:
  e2e:smoke 171/171, e2e:flows 39/39 (+3 skipped), e2e:tenant 671/671 (0 leaks), part-2 fixes 18/18, invoices 6/6,
  leave/payroll 45/45, CRM 29/29, tickets/certs 21/21, leads 9/9, B10/O1/T1 16/16, people-route validation 33/33;
  25/25 unit tests; client lint + tsc. Scratchpad scripts expecting 400 (live-h1h3, lifecycle) are stale since 422.

- **2026-10-31 — Wave 3 part 1.** Four parallel agents (CRM activities · leave + payroll · tickets + certificates ·
  exports + employee lifecycle); a usage limit and a session restart interrupted them, all resumed and finished.
  Fixes found on the way: every ticket reply 500ed (`TicketMessage.language` defaulted to null, which MongoDB
  rejects as the text index's language override — default removed); `POST /leads` always failed (required
  `fullName` never set, invalid `medium`/`manual` enum defaults, and the client's `company`/`contact`/
  `estimatedValue` didn't exist on the model) — `crmController` now maps fields both ways and escapes search;
  leave cancel 500; payroll subtracted LOP days as money; three imports used `models/Organization.js` (file is
  lowercase, would break on Linux). Verified live: e2e:smoke 171/171, e2e:flows 42/42, leads 9/9, CRM 29/29,
  leave/payroll 45/45, lifecycle 20/20, tickets/certificates 21/21, B10/O1/T1 16/16; 22/22 unit tests, client
  lint + build. Environment: the nvm default node flipped back to v12 after the restart (owner then switched to
  v22); the dev server was started with `nodemon --exec <v22 node.exe>` from PowerShell. NOT clicked through in a
  browser.

- **2026-10-29 (PM 2) — B10, O1, T1.** Study materials scoped for students/parents (`visibleClassIdsFor`); org
  list count/deleted view/restore endpoint + UI, detail page by id; ticket assignees endpoint + picker (populate now
  includes `publicId`). Verified: node --check, 17/17 tests, client lint + tsc, `e2e:smoke` 171/171, and a live
  script 16/16 (student sees institute + own-class material but not another class's; admin sees all; total excludes
  deleted; admin `?deleted=true` leaks nothing; admin restore 403, super_admin restore 200; support lists
  admin/hr/support assignees, student 403; assigning a student 400; assign round-trips). Also documented in §3 how
  agents avoid permission prompts (the owner was being asked on every PATH-prefixed / heredoc command).

- **2026-10-29 (PM) — Status report + Wave 2 finished.** Re-checked the uncommitted tree (lint, tsc, build,
  17/17 tests green), found Wave 2 ~60% landed, finished the rest with 3 parallel agents (no file overlap).
  Security fixes found on the way: `deleteUser` had no org/role check (any admin could deactivate users in other
  orgs; also `canManageRole` was never imported, so `updateUser` crashed on role/email changes) and `updateUser`
  let non-admin roles with `user:update` edit users in other orgs or above them; both now enforce same org +
  `canManageRole`. Regression found by `e2e:smoke`: `GET /tickets` 500ed for every role once tickets existed
  (`populate("assigneeId")` on a field the model doesn't have) — now populates `assignment.assignedTo`, writes the
  assignee there (resolved by publicId, same tenant) and returns `assigneeId` for the client. Verified live against
  the running dev server: `e2e:smoke` 171/171; `e2e:flows` 39/42 (the 3 failures are check-in/out "already today"
  state from an earlier run, not code); a Wave 2 script (12/12: B8 with/without class, material edit + class filter,
  teacher grades / student 403, admin can't delete admin, principal can't edit admin, admin can't create org,
  super_admin creates + deletes org); ticket assign/unassign. NOT clicked through in a browser.
  Open items recorded as B10, O1, T1.

- **2026-10-29 — "Make it 100%" kickoff: waves 1, 2 (partial) and 4 (payments).** Owner decisions recorded in §0.
  Wave 1 committed (`3fe1187`). Wave 2 was split across 4 parallel agents with no file overlap. The owner stopped
  the Platform agent (no changes) and the Learning agent. The Learning agent's `submissionController.js` fixes are
  uncommitted (B7). The other two agents were still running at the time of writing. Wave 4 payments (uncommitted):
  - Server: `models/PaymentTransaction.js` (`Payment`), `services/razorpay.js` (REST + HMAC checks),
    `services/paymentService.js` (single path for payments and refunds, receipt numbers `RCPT-YYYY-NNNNN`,
    idempotent on gateway payment id), `controllers/paymentController.js`, `routes/paymentRoutes.js` mounted at
    `/api/payments`. The webhook route is unauthenticated and checked by signature, using `req.rawBody` from the
    JSON parser's `verify` hook in app.js. New env keys are in config/env.js. `billingController.recordPayment`
    now goes through the service.
  - Client: `features/payments/paymentsApi.ts` (registered in store), `components/payments/PayOnlineButton.tsx`
    (Razorpay Checkout) and `InvoicePaymentsModal.tsx` (history, printable receipt, refund), wired into InvoicesPage.
  - Verified live: manual partial payment → receipt + `partially_paid`; drafts and overpayment rejected; webhook
    bad signature 400, good 200, replay idempotent → invoice `paid`; refund 403 for student, 200 for accountant;
    student and parent see only their own/children's payments; order without keys 503. NOT verified: real
    checkout/verify against Razorpay (needs keys).

- **2026-10-29 — Full per-role re-audit (static + runtime).** Rebuilt §8b using the real route gates (195
  routes), client nav→hook→endpoint mapping and 210 live GETs as the 11 demo users: 0 load failures. New bugs
  B4 (teachers/principals can't grade attempts; confirmed live) and B5 (counselor class picker empty). Added
  backlog B4, B5, U1. Per-role scope came from the original spec (`git show 60cb432:"kya vishye.md"`), which
  only defines 6 roles; principal/accountant/counselor/support/parent scope is inferred. No code changed.
  Follow-up: feature-depth table (§8c), and a direct-axios-call check that found B6 (no `PUT /auth/profile`).

- **2026-10-29 — Status report + quick fixes.** Added a random `JWT_REFRESH_SECRET` to local `server/.env`
  (git-ignored; `JWT_ACCESS_SECRET` was already present), renamed the root package `yolo-hrm`→`paisa`, and confirmed
  G1b/G6 were already resolved (no tracked `server/node_modules` or tsbuildinfo). Verified: 17/17 server tests,
  `node --check` on all server files, client lint + build, and a server boot against Atlas (`/health/ready` ok) with
  admin login + cookie refresh succeeding. Still open: H1, H2, H3, H5, F4, F5.

- **2026-10-29 — First run against a real MongoDB (Atlas `paisa` DB, demo org `demo-school`).** Seeded 11 demo
  users (`npm run seed`, `<role>@demo.paisa.test`, pw `Paisa@Demo1`), then ran `server/scripts/e2e-smoke.mjs`
  (172 role-page calls) and `e2e-flows.mjs` (42 end-to-end checks): all pass. Running for real exposed bugs no
  unit test could see, now fixed: (1) 44 tenant-unique `sparse` compound indexes collided on null, so the 2nd
  class/test/invoice/contact/geofence/document in a tenant failed — fixed globally by `config/mongoosePlugins.js`
  (partial indexes) plus `npm run db:fix-indexes` (already applied to `paisa`: 39 indexes); (2) attempts used a
  non-existent `in_progress` status (now `started`), stored `score` as an object (model keeps flat
  score/maxScore/percentage/passed), and wrote answers the schema rejects; (3) questions: `points`/`correctAnswer`
  were silently dropped (model has `marks` + `answer`), `published` is not a status (`active`), options need
  keys — grading never worked, now mapped in testController (`questionView`, `isAnswerCorrect`); (4) invoice
  statuses in the controller did not match the model enum (`sent`→`issued`); (5) reviews: required `period`,
  wrong populate fields (500 for employees); (6) geofence soft delete left it active; (7) User codes collided for
  roles sharing the `USR` prefix; (8) the audit trail was never mounted — now every successful/failed mutation by
  a signed-in user is recorded (routes/index.js); (9) Employee externalId index. `server/.env` has NO
  `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` — add them before `npm run dev` (the test API got temporary ones).
  Still not covered: browser UI walk-through, files outside the two e2e scripts, super_admin cross-tenant flows.

- **2026-10-29 — Parity round (uncommitted).** Routes for assignments/materials/grading/departments/classes
  now use `authorize({anyPermissions})` and pages use `usePermission` (principal gained class/enrollment delete,
  assignment/material create). HR Ops page doubles as "My Records" for employee/teacher/student/parent with tabs
  gated by read perms; certificates `?userId=` can no longer widen a student/employee scope, parents see only their
  children's certificates, employees see only their own reviews, and review creation accepts a user id (the UI sent
  one while the server expected an Employee profile id). Parent attendance gets child chips and per-child
  summaries; support sees the Customers tab (`PATH_PERMISSION` now takes an any-of list); CRM contacts/customers
  can be edited; `/attendance/qr-scan` is rate limited (15 per 10 min per student); Tests page gates grading by
  `test_attempt:read`. Added 17 server tests. Verified: node --test, node --check, routes load, client lint + build.
  Estimated per-role completeness is ~88-92% (static estimate, NOT runtime-tested) — 95% is unproven until the
  app is exercised against MongoDB per role.

- **2026-10-29 — Review fixes.** By-id fetches now match the list scoping: `getInvoice`, `getAssignment`,
  `getTest`, `startAttempt` use `visibleClassIdsFor` / `childUserIdsFor` (`utils/parentScope.js`).
  `startAttempt` resumes only `in_progress` attempts and enforces `attemptPolicy.maxAttempts`; Tests page
  shows "View result" for finished tests. TakeTestModal keeps a localStorage draft. Employee document
  `fileUrl` must be http(s). QR scan claim is atomic. Attendance day key uses the client's IANA timezone
  (`timezone` body field, UTC fallback). Unknown parent ids return 400. Open: no rate limit on `/attendance/qr-scan`.

- **2026-10-29 — M2 attendance.** Server: `/api/geofences` (admin CRUD, circles), `/api/qr-sessions`
  (teacher/admin open a class code, stored hashed, 1-60 min), `POST /api/attendance/check-in`
  (haversine check against active geofences; no geofences = accepted anywhere, markedVia self_checkin)
  and `POST /api/attendance/qr-scan` (students, must be enrolled). Perms: teacher gets `qr_session:*`
  (read/create/update), hr gets `attendance:create`. Client: AttendanceTools panels on AttendancePage.
  Verified: node --check, routes load, client lint + build. Not runtime-tested; GPS spoofing is not
  prevented (browser location is client-supplied).

- **2026-10-28 (2) — M1 + M4.** Added controllers/routes for employee documents, contacts and customers
  (whitelisted fields via `utils/crudHelpers.js`, tenant-scoped, soft delete) and a `crmApi` client slice
  with `PartiesPanel` (CRM tabs) and `EmployeeDocumentsPanel` (HR Ops tab). Employees can read their own
  documents server-side but HR Ops is not in their nav yet. File upload is a link only (no storage backend).
  Server routes module loads; client lint/build result recorded in the final report of this session.

- **2026-10-28 — Role completeness push (uncommitted on feature/roles-polaris).** Reviewed the
  in-flight R1-R6 work, finished and verified it. Added: student test-taking (`getTest` hook,
  TakeTestModal wired into TestsPage, My Results tab; attempts populate now returns `publicId`);
  nav dedupe + counselor Enrollments + Gamification for admin/principal/employee; permission-based
  gating on 7 pages; invoice Send/Cancel for accountant; parent-child link (G2); audit log viewer (M3).
  Checks: `node --check` on all changed server files, routes module loads, client `npm run lint`
  and `npm run build` pass. NOT runtime-tested (no MongoDB here). Still open: M1 employee documents,
  M2 geofence/QR attendance, M4 CRM contacts/customers, R7 remainder, F4/F5, H1-H5. Gamification
  nav/path now keys off `achievement:read` (what the server checks), not `gamification:read`.

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
