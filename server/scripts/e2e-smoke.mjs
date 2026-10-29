// Needs the API running and the demo data seeded (npm run seed). API_URL overrides the default.
// Smoke test: sign in as each demo role and call the API behind every page in its nav.
const BASE = process.env.API_URL ?? "http://127.0.0.1:5000/api";
const PASSWORD = "Paisa@Demo1";

const PAGES = {
  classes: ["/classes"],
  enrollments: ["/enrollments"],
  assignments: ["/assignments"],
  tests: ["/tests"],
  testsStaff: ["/tests", "/questions"],
  attempts: ["/attempts"],
  materials: ["/study-materials"],
  live: ["/live-sessions"],
  attendanceMe: ["/attendance/me"],
  attendanceStaff: ["/attendance", "/attendance/me"],
  leaves: ["/leaves"],
  payroll: ["/payroll"],
  departments: ["/departments"],
  employees: ["/employees"],
  students: ["/students"],
  teachers: ["/teachers"],
  users: ["/users"],
  orgs: ["/organizations"],
  hrOpsFull: ["/salary-structures", "/reviews", "/certificates", "/employee-documents"],
  hrOpsReadOnly: ["/salary-structures", "/reviews", "/certificates"],
  hrOpsSelfEmployee: ["/reviews", "/employee-documents"],
  certs: ["/certificates"],
  hr: ["/hr"],
  invoices: ["/invoices"],
  crmFull: ["/leads", "/deals", "/contacts", "/customers"],
  crmLeads: ["/leads", "/deals"],
  customers: ["/customers"],
  tickets: ["/tickets"],
  messages: ["/conversations"],
  announcements: ["/announcements"],
  events: ["/events"],
  audit: ["/audit-logs"],
  settings: ["/notifications/preferences", "/notifications"],
};

const NAV = {
  admin: ["classes", "enrollments", "assignments", "testsStaff", "attempts", "materials", "live", "attendanceStaff", "leaves", "payroll", "departments", "employees", "students", "teachers", "users", "orgs", "hrOpsFull", "hr", "invoices", "crmFull", "tickets", "messages", "announcements", "events", "audit", "settings"],
  principal: ["classes", "enrollments", "assignments", "tests", "materials", "live", "attendanceStaff", "leaves", "payroll", "departments", "employees", "students", "teachers", "users", "orgs", "hrOpsReadOnly", "hr", "invoices", "crmLeads", "tickets", "messages", "announcements", "events", "settings"],
  hr: ["departments", "hrOpsFull", "employees", "teachers", "attendanceStaff", "hr", "leaves", "payroll", "messages", "announcements", "events", "tickets", "settings"],
  accountant: ["payroll", "invoices", "tickets", "messages", "settings"],
  counselor: ["students", "enrollments", "crmFull", "messages", "announcements", "events", "tickets", "settings"],
  teacher: ["students", "classes", "enrollments", "assignments", "testsStaff", "attempts", "materials", "live", "attendanceStaff", "leaves", "certs", "messages", "announcements", "events", "tickets", "settings"],
  support: ["customers", "tickets", "messages", "settings"],
  employee: ["attendanceMe", "leaves", "payroll", "hrOpsSelfEmployee", "messages", "announcements", "events", "tickets", "settings"],
  parent: ["classes", "assignments", "tests", "attendanceMe", "live", "invoices", "certs", "messages", "announcements", "events", "tickets", "settings"],
  student: ["classes", "enrollments", "assignments", "tests", "attempts", "materials", "live", "attendanceMe", "leaves", "invoices", "certs", "messages", "announcements", "events", "tickets", "settings"],
  super_admin: ["orgs", "users", "audit", "tickets", "settings"],
};

const only = process.argv.slice(2);
const roles = only.length ? only : Object.keys(NAV);
const failures = [];
let calls = 0;

for (const role of roles) {
  const login = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: `${role}@demo.paisa.test`, password: PASSWORD }),
  });
  const body = await login.json().catch(() => ({}));
  const token = body?.data?.accessToken;

  if (!token) {
    failures.push(`${role}: LOGIN ${login.status} ${body?.message ?? ""}`);
    console.log(role.padEnd(12), "LOGIN FAILED", login.status, body?.message ?? "");
    continue;
  }

  const bad = [];
  const urls = [...new Set(NAV[role].flatMap((page) => PAGES[page]))];

  for (const url of urls) {
    calls += 1;
    const res = await fetch(BASE + url, { headers: { authorization: `Bearer ${token}` } });
    if (res.status !== 200) {
      const msg = (await res.json().catch(() => ({})))?.message ?? "";
      bad.push(`${url} ${res.status} ${msg}`.trim());
    }
  }

  console.log(role.padEnd(12), `${urls.length - bad.length}/${urls.length} ok`, bad.length ? "\n    " + bad.join("\n    ") : "");
  failures.push(...bad.map((b) => `${role}: ${b}`));
}

console.log(`\n${calls} calls, ${failures.length} problems`);
