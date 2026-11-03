# PAISA — status report (2026-11-03)

Measured from the code and the running system: every API route's gate run for all
11 roles, client/server permission lists compared, and every test suite re-run.
Role and feature percentages are judgements against the product spec.

## 1. Overall

| | |
|---|---|
| **Features** | ≈ **87 %** average across 29 feature areas |
| **Roles** | ≈ **85–93 %** each — every role can do its main job end to end |
| **Tests** | **all green** — 97 unit tests (93 server, 4 client) + 1,192 live API checks, 0 cross-organization leaks |
| **Code** | on `main` |

## 2. Roles

"API routes" = endpoints the role is allowed through (measured). "Menu" = pages in its sidebar besides Dashboard and Settings.

| Role | Permissions | API routes | Menu | Done | What they can do |
|---|---|---|---|---|---|
| super_admin | 271 (all) | 300 | 9 | 92 % | All organizations, companies/institutes, users, plans, audit log, system jobs, platform reports, user security resets |
| admin | 256 | 286 | 26 | 93 % | Whole organization: people, academics, HR, payroll + tax, invoices + reconciliation, CRM, tickets, gamification, kiosks |
| principal | 92 | 185 | 25 | 88 % | Academics fully; reads HR/finance; approves leaves (no billing page — by design) |
| hr | 66 | 145 | 13 | 92 % | Employees, leave policies, payroll, auto TDS, tax declarations, reviews with goals/PIP, documents, certificates + templates |
| teacher | 74 | 145 | 17 | 92 % | Classes, assignments with rubrics, timed tests with integrity log, QR attendance, materials, live classes, grading |
| counselor | 58 | 127 | 10 | 88 % | Leads with scoring, deals, pipelines, contacts/customers, tasks/notes, enrollments |
| student | 47 | 104 | 15 | 88 % | Classes, submissions, timed tests, scan-to-attend, invoices + online pay, points/badges/rewards |
| accountant | 40 | 102 | 6 | 88 % | Invoices, payments/refunds, reconciliation, payroll "paid", finance reports and trends |
| parent | 40 | 92 | 12 | 82 % | Children's classes, work, tests, attendance, invoices (read-mostly by design) |
| employee | 37 | 91 | 9 | 88 % | Self-service: check-in/kiosk, leave, payslips, tax declaration + statement, review progress, rewards |
| support | 34 | 82 | 6 | 86 % | Tickets (deadlines, merge, templates), customers, chat; basic reports |

Everyone also has chat, notifications, 2FA, signed-in devices and a Settings page listing their own permissions.

## 3. Permissions & security (measured)

- **300 API routes**: 266 check a permission; 25 need only a login and the controller checks ownership
  (own profile, own sessions, files you may open, own submissions…); 9 are public on purpose (login, 2FA step,
  token refresh, forgot/reset password, registration — off by default, certificate verification, kiosk screen,
  Razorpay webhook).
- **271 permissions**; the menu never shows a page a role can't open (0 mismatches).
- **Client and server permission lists are identical** (regenerated: no difference).
- **Tenant isolation**: 671 cross-organization checks, 0 leaks.
- **Signed-out / revoked sessions stop working immediately**, including live updates.

## 4. Features

| Done | Features |
|---|---|
| 95 % | Auth & sessions (2FA, devices) · Messaging (reactions, seen-by, files, search) · Attendance (geofence, QR, kiosk) |
| 92–94 % | Payroll + income tax · Certificates + templates · Files (disk + S3) · Gamification (points, streaks, badges, rewards) |
| 88–90 % | Assignments (rubrics) · Tests (time limits) · CRM leads/deals (scoring) · Invoices + reconciliation · People · Departments · Organizations · Reviews (goals/PIP) |
| 85–86 % | Classes & enrollments · Leaves · Study materials · Users & roles · Audit log · Pipelines · Employee documents · Tickets |
| 80 % | Reports (per-role charts) · Announcements/events · CRM activities |
| 75 % | Billing/subscriptions (real checkout untested) · Live sessions (no recording) · Notifications (no SMS/push) |

## 5. What's left

**Needs the owner**
1. Working **Razorpay** test keys (the current pair is rejected by Razorpay).
2. **Resend** key for email (ready; without a key emails go to the log).
3. **S3** keys if cloud storage is wanted (ready; `STORAGE_PROVIDER=s3`).
4. Decisions: deals per pipeline stages? SMS/push, AI, other languages — yes or no? Clean demo-data leftovers?
5. Confirm **FY 2026-27 tax rates** (assumed same as 2025-26 in `server/src/config/incomeTax.js`).

**Can still be built**: peer review on assignments, richer reports, live-session recording (needs a Jitsi plan).

**Not yet confirmed**: new screens from waves 12–14 were not visually checked (machine low on memory; their
APIs are tested live); the first GitHub Actions CI run; this machine's default Node is v12 — run
`nvm use 22.14.0` before `npm` commands.

See `CONTEXT.md` for the detailed history and decisions.
