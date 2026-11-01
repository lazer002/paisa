// Needs the API running and both demo orgs seeded (npm run seed). API_URL overrides the default.
// H2 tenant isolation, end to end (demo accounts only):
//   org 1 "Demo School"      <role>@demo.paisa.test   (all school roles)
//   org 2 "Demo Company Two" <role>@demo2.paisa.test  (admin, hr, accountant, support, employee)
// For each resource family one tenant creates a record and the other tenant's
// users must not see it in lists (404/403 on GET/PUT/DELETE by publicId).
// Also checks foreign references (org-2 ids in org-1 bodies) and body
// `instituteId` mass assignment. Everything created is removed afterwards.
// Prints PASS/FAIL per check, a summary, then LEAKS / SETUP / ERRORS lists.
// Always exits 0: it is a report.

const BASE = process.env.API_URL ?? "http://127.0.0.1:5000/api";
const HEALTH = BASE.replace(/\/api\/?$/, "") + "/health";
const PASSWORD = "Paisa@Demo1";

const ORG1_ROLES = ["admin", "principal", "hr", "accountant", "counselor", "teacher", "support", "employee", "parent", "student"];
const ORG2_ROLES = ["admin", "hr", "accountant", "support", "employee"];

const k2 = (role) => `${role}@2`;
const ALL1 = ORG1_ROLES;
const ALL2 = ORG2_ROLES.map(k2);

const results = [];
const leaks = [];
const setups = [];
const errors = [];
const odd = [];
const leftovers = [];
let family = "setup";

const stamp = Date.now();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const ok2xx = (status) => status >= 200 && status < 300;
const id = (row) => row?.publicId ?? row?._id;

// Replace ids in a path with ":id" for the report.
const tpl = (path) =>
  path.replace(/(?<=[/=])([a-z]+(?:_[a-z]+)*_[A-Za-z0-9_-]{6,}|[a-f0-9]{24})/g, ":id");

const check = (name, ok, detail = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  [${family}] ${name}${detail ? `  -> ${detail}` : ""}`);
  return ok;
};

const setup = (what, r) => {
  const details = r?.json?.errors ?? r?.json?.details;
  const extra = details ? ` ${JSON.stringify(details).slice(0, 200)}` : "";
  const line = `[${family}] ${what}: ${r?.status ?? "-"} ${r?.message ?? ""}${extra}`;
  setups.push(line);
  console.log(`SETUP ${line}`);
};

const section = (name) => {
  family = name;
  console.log(`\n── ${name} ──`);
};

/* ───────────────────────── HTTP ───────────────────────── */

// Retries while nodemon restarts the server, and waits out rate limits.
const request = async (url, init) => {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, init);
      if (res.status === 429 && attempt < 30) {
        const wait = Math.min(Number(res.headers.get("retry-after")) || 5, 70);
        console.log(`      (rate limited, waiting ${wait}s)`);
        await sleep(wait * 1000);
        continue;
      }
      return res;
    } catch (err) {
      if (attempt >= 45) throw err;
      await sleep(2000);
    }
  }
};

const waitForHealth = async () => {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(HEALTH);
      if (res.ok) return true;
    } catch {
      // not up yet
    }
    await sleep(3000);
  }
  return false;
};

const sessions = {};
const emails = {};
const me = {};

const login = async (key, email) => {
  const res = await request(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  const body = await res.json().catch(() => ({}));
  if (!body?.data?.accessToken) {
    setup(`login ${email}`, { status: res.status, message: body?.message });
    return false;
  }
  sessions[key] = body.data.accessToken;
  emails[key] = email;
  me[key] = body.data.user;
  return true;
};

const call = async (key, method, path, body) => {
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await request(BASE + path, {
      method,
      headers: { authorization: `Bearer ${sessions[key]}`, "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let json = {};
    try {
      json = JSON.parse(text);
    } catch {
      // non-JSON body
    }
    // Access token expired mid-run: log in again once.
    if (res.status === 401 && attempt === 0 && emails[key]) {
      await login(key, emails[key]);
      continue;
    }
    return { status: res.status, data: json?.data, message: json?.message ?? "", json, text };
  }
};

/** The id of a created record (some endpoints wrap it: { ticket }, { conversation }, ...). */
const createdId = (data) => {
  if (!data || typeof data !== "object") return null;
  if (Array.isArray(data)) return id(data[0]);
  if (id(data)) return id(data);
  const key = Object.keys(data).find((k) => data[k] && typeof data[k] === "object" && data[k].publicId);
  return key ? data[key].publicId : null;
};

/** GET a list, paging while the response says there is more; returns the concatenated body text. */
const fetchList = async (key, path) => {
  let text = "";
  let last = "";
  let status = 0;
  let message = "";
  for (let page = 1; page <= 30; page++) {
    const sep = path.includes("?") ? "&" : "?";
    const r = await call(key, "GET", `${path}${sep}limit=100&page=${page}`);
    status = r.status;
    message = r.message;
    if (!ok2xx(r.status)) break;
    if (r.text === last) break;
    last = r.text;
    text += r.text;
    const p = r.json?.meta?.pagination ?? r.json?.pagination ?? r.json?.meta ?? {};
    const more =
      /"hasNextPage"\s*:\s*true/.test(r.text) ||
      (Number(p.totalPages ?? p.pages) > page);
    if (!more) break;
  }
  return { status, text, message };
};

const listed = async (key, path, needle) => {
  const r = await fetchList(key, path);
  return ok2xx(r.status) && r.text.includes(needle);
};

/* ───────────────────────── check helpers ───────────────────────── */

const verb = (method) =>
  ({ GET: "read", PUT: "modified", PATCH: "modified", DELETE: "deleted", POST: "wrote to" })[method] ?? method;

/**
 * Expects a refusal. 2xx = leak, 5xx = error, other 4xx = pass (non-403/404
 * statuses are listed separately). `undo(r)` cleans up when a write leaked.
 */
const expectDenied = async (key, method, path, body, what, undo) => {
  if (!sessions[key]) return null;
  const r = await call(key, method, path, body);
  const name = `${method} ${tpl(path)} as ${key} is refused`;
  if (ok2xx(r.status)) {
    check(name, false, `${r.status} LEAK`);
    leaks.push(`${method} /api${tpl(path)} as ${key}: ${what} (got ${r.status})`);
    if (undo) {
      try {
        await undo(r);
      } catch (err) {
        leftovers.push(`[${family}] undo failed after leak: ${err.message}`);
      }
    }
  } else if (r.status >= 500) {
    check(name, false, `${r.status} ERROR ${r.message}`);
    errors.push(`[${family}] ${method} /api${tpl(path)} as ${key}: ${r.status} ${r.message}`);
  } else {
    const plain = [403, 404].includes(r.status);
    check(name, true, plain ? "" : `${r.status} ${r.message}`);
    if (!plain) odd.push(`[${family}] ${method} /api${tpl(path)} as ${key}: ${r.status} ${r.message}`);
  }
  return r;
};

const expectNotListed = async (key, path, needle, label) => {
  if (!sessions[key]) return;
  const r = await fetchList(key, path);
  const name = `GET ${tpl(path)} as ${key} does not list the ${label}`;
  if (r.status >= 500) {
    check(name, false, `${r.status} ERROR ${r.message}`);
    errors.push(`[${family}] GET /api${tpl(path)} as ${key}: ${r.status} ${r.message}`);
  } else if (ok2xx(r.status) && r.text.includes(needle)) {
    check(name, false, "LEAK");
    leaks.push(`GET /api${tpl(path)} as ${key}: returned the other tenant's ${label} in the list`);
  } else {
    check(name, true, ok2xx(r.status) ? "" : String(r.status));
  }
};

/** Control: the owning tenant can use the route (else the cross-tenant checks would prove nothing). */
const control = async (key, method, path, body, label) => {
  const r = await call(key, method, path, body);
  if (ok2xx(r.status)) {
    console.log(`ok    [${family}] control: ${key} ${method} ${tpl(path)}`);
    return true;
  }
  setup(`control ${method} ${tpl(path)} as ${key} (${label}) failed, its checks are skipped`, r);
  return false;
};

const controlList = async (key, path, needle, label) => {
  const r = await fetchList(key, path);
  if (ok2xx(r.status) && r.text.includes(needle)) {
    console.log(`ok    [${family}] control: ${key} sees its ${label} in GET ${tpl(path)}`);
    return true;
  }
  if (r.status >= 500) errors.push(`[${family}] GET /api${tpl(path)} as ${key}: ${r.status} ${r.message}`);
  setup(`control GET ${tpl(path)} as ${key} does not show its own ${label}, list checks skipped`, r);
  return false;
};

const create = async (key, path, body, label) => {
  if (!sessions[key]) {
    setup(`${key} POST ${path} (${label}): no session`, null);
    return null;
  }
  const r = await call(key, "POST", path, body);
  const newId = ok2xx(r.status) ? createdId(r.data) : null;
  if (!newId) {
    setup(`${key} POST ${path} (${label})`, r);
    return null;
  }
  return { id: newId, data: r.data, raw: r };
};

/**
 * POST /users sometimes answers 400 "A duplicate record already exists" (the
 * per-org staff code sequence lags behind seeded codes); retry with a new email.
 */
const createUser = async (key, body, label) => {
  let r = null;
  for (let attempt = 0; attempt < 6; attempt++) {
    const email = body.email.replace("@", attempt ? `-${attempt}@` : "@");
    r = await call(key, "POST", "/users", { ...body, email });
    if (ok2xx(r.status) && createdId(r.data)) {
      if (attempt) odd.push(`[${family}] POST /api/users as ${key} needed ${attempt} retr${attempt > 1 ? "ies" : "y"} (400 duplicate record: code sequence collision, not tenant related)`);
      return { id: createdId(r.data), data: r.data, raw: r, email };
    }
    if (!/duplicate/i.test(r.message)) break;
  }
  setup(`${key} POST /users (${label})`, r);
  return null;
};

const cleanup = async (key, method, path, label) => {
  const r = await call(key, method, path);
  if (!ok2xx(r.status)) {
    leftovers.push(`[${family}] ${method} /api${tpl(path)} as ${key} (${label}): ${r.status} ${r.message}`);
    console.log(`WARN  [${family}] cleanup ${method} ${tpl(path)} as ${key}: ${r.status} ${r.message}`);
  }
  return r;
};

/**
 * Standard isolation pass for one record:
 *   list   -> owner sees it, `listRoles` do not
 *   gets   -> owner can GET, `getRoles` get 403/404
 *   writes -> [{ method, path, body, controlBody?, roles?, what? }] (control when controlBody given)
 */
const isolate = async ({ label, needle, owner, list, listRoles = [], gets = [], getRoles = [], writes = [], writeRoles = [] }) => {
  for (const path of [].concat(list ?? [])) {
    if (await controlList(owner, path, needle, label)) {
      for (const key of listRoles) await expectNotListed(key, path, needle, label);
    }
  }
  for (const path of gets) {
    if (await control(owner, "GET", path, undefined, label)) {
      for (const key of getRoles) await expectDenied(key, "GET", path, undefined, `read the other tenant's ${label}`);
    }
  }
  for (const w of writes) {
    if (w.controlBody !== undefined && !(await control(owner, w.method, w.path, w.controlBody, label))) continue;
    for (const key of w.roles ?? writeRoles) {
      await expectDenied(key, w.method, w.path, w.body, w.what ?? `${verb(w.method)} the other tenant's ${label}`);
    }
  }
};

/* ───────────────────────── start ───────────────────────── */

if (!(await waitForHealth())) {
  console.log(`API not reachable at ${HEALTH} after 3 minutes; nothing checked.`);
  process.exit(0);
}

for (const role of ORG1_ROLES) await login(role, `${role}@demo.paisa.test`);
for (const role of ORG2_ROLES) await login(k2(role), `${role}@demo2.paisa.test`);

if (!sessions.admin || !sessions[k2("admin")]) {
  console.log("Cannot log in as both org admins; is the second demo org seeded? Stopping.");
  process.exit(0);
}

// ── Lookups ──
const refsOf = (value) => {
  if (!value) return [];
  if (typeof value === "string") return [value];
  return [value._id, value.publicId].filter(Boolean).map(String);
};

const orgRefs = async (key) => {
  const refs = new Set(refsOf(me[key]?.instituteId ?? me[key]?.institute));
  const who = await call(key, "GET", "/auth/me");
  const u = who.data?.user ?? who.data;
  for (const ref of refsOf(u?.instituteId ?? u?.institute)) refs.add(ref);
  const orgs = await call(key, "GET", "/organizations");
  const rows = Array.isArray(orgs.data) ? orgs.data : orgs.data?.organizations ?? [];
  for (const org of rows) {
    if (refs.has(String(org._id)) || refs.has(String(org.publicId))) {
      refs.add(String(org._id));
      if (org.publicId) refs.add(String(org.publicId));
    }
  }
  return [...refs].filter(Boolean);
};

const org1Refs = await orgRefs("admin");
const org2Refs = await orgRefs(k2("admin"));
console.log(`org 1 ids: ${org1Refs.join(", ") || "(unknown)"}`);
console.log(`org 2 ids: ${org2Refs.join(", ") || "(unknown)"}`);

const users1 = (await call("admin", "GET", "/users?limit=100")).data ?? [];
const users2 = (await call(k2("admin"), "GET", "/users?limit=100")).data ?? [];
const uid = (list, email) => id(list.find((u) => u.email === email));

const student1 = uid(users1, "student@demo.paisa.test");
const support1 = uid(users1, "support@demo.paisa.test");
const employee1 = uid(users1, "employee@demo.paisa.test");
const admin1 = uid(users1, "admin@demo.paisa.test");
const admin2 = uid(users2, "admin@demo2.paisa.test");
const hr2 = uid(users2, "hr@demo2.paisa.test");
const support2 = uid(users2, "support@demo2.paisa.test");
section("setup");
check("org-1 demo users found (student, support, employee, admin)", !!(student1 && support1 && employee1 && admin1));
check("org-2 demo users found (admin, hr, support)", !!(admin2 && hr2 && support2));

// A throwaway org-2 employee used as the target of foreign references, so a
// leak never touches pre-existing demo data.
// Remove leftovers of earlier runs (only records this script names: "Iso … <13-digit stamp>",
// lastName "<word> <stamp>" with firstName "Iso", or emails iso-<stamp>-…).
section("sweep earlier runs");
{
  const ours = (row) =>
    [row.title, row.name, row.subject, row.notes, row.text].some((v) => typeof v === "string" && /^Iso\b.*\d{13}/.test(v)) ||
    (row.firstName === "Iso" && /\d{13}/.test(row.lastName ?? "")) ||
    /^iso-\d{13}-/.test(row.email ?? "");
  const targets = ["/tests", "/questions", "/assignments", "/classes", "/leads", "/deals", "/invoices", "/contacts", "/customers",
    "/salary-structures", "/crm-tasks", "/crm-activities", "/crm-notes", "/departments", "/geofences", "/announcements",
    "/tickets", "/study-materials", "/employees", "/users", "/pipelines", "/reviews", "/certificates", "/employee-documents"];
  let swept = 0;
  for (const key of ["admin", k2("admin"), "hr", k2("hr"), "accountant", k2("accountant")]) {
    for (const path of targets) {
      const r = await call(key, "GET", `${path}?limit=100`);
      if (!ok2xx(r.status)) continue;
      const rows = Array.isArray(r.data) ? r.data : Object.values(r.data ?? {}).find(Array.isArray) ?? [];
      for (const row of rows) {
        if (!ours(row) || !id(row)) continue;
        const d = await call(key, "DELETE", `${path}/${id(row)}`);
        if (ok2xx(d.status)) swept++;
      }
    }
  }
  console.log(`swept ${swept} leftover record(s) from earlier runs`);
}
section("setup");

const scratch = await createUser(k2("admin"), {
  name: `Iso Scratch ${stamp}`,
  email: `iso-${stamp}-scratch@demo2.paisa.test`,
  password: PASSWORD,
  role: "employee",
}, "scratch org-2 employee");
const scratch2 = scratch?.id;

const future = (days) => new Date(Date.now() + days * 86400000).toISOString();

/* ═════════════════════ org 2 owns, org 1 must not see ═════════════════════ */

// ── users ──
section("users");
{
  const rec = await createUser(k2("admin"), {
    name: `Iso User ${stamp}`,
    email: `iso-${stamp}-user@demo2.paisa.test`,
    password: PASSWORD,
    role: "employee",
  }, "user");
  if (rec) {
    await isolate({
      label: "user",
      needle: rec.id,
      owner: k2("admin"),
      list: "/users",
      listRoles: ALL1,
      gets: [`/users/${rec.id}`, `/users/${rec.id}/detail`],
      getRoles: ["admin", "principal", "hr", "counselor", "teacher", "accountant", "support"],
      writes: [
        { method: "PUT", path: `/users/${rec.id}`, body: { name: "Leaked Name" }, controlBody: { name: `Iso User ${stamp} b` } },
        { method: "DELETE", path: `/users/${rec.id}` },
      ],
      writeRoles: ["admin", "principal", "hr"],
    });
    if (admin2) await expectDenied("admin", "GET", `/users/${admin2}`, undefined, "read the org-2 admin user");
    await cleanup(k2("admin"), "DELETE", `/users/${rec.id}`, "user");
  }
}

// ── employees ──
section("employees");
{
  const rec = await create(k2("hr"), "/employees", {
    name: `Iso Employee ${stamp}`,
    email: `iso-${stamp}-emp@demo2.paisa.test`,
    password: PASSWORD,
  }, "employee");
  if (rec) {
    await isolate({
      label: "employee",
      needle: rec.id,
      owner: k2("hr"),
      list: "/employees",
      listRoles: ["admin", "principal", "hr", "accountant", "support", "employee"],
      gets: [`/employees/${rec.id}`, `/employees/${rec.id}/lifecycle`],
      getRoles: ["admin", "principal", "hr"],
      writes: [
        { method: "PUT", path: `/employees/${rec.id}`, body: { name: "Leaked Name" }, controlBody: { name: `Iso Employee ${stamp} b` } },
        { method: "POST", path: `/employees/${rec.id}/stage`, body: { stage: "suspended", note: "leak" }, controlBody: { stage: "probation", note: "iso" } },
        {
          method: "PUT",
          path: `/employees/${rec.id}/checklist`,
          body: { items: [{ label: "Leaked", phase: "onboarding", done: true }] },
          controlBody: { items: [{ label: "Iso", phase: "onboarding", done: false }] },
        },
        { method: "DELETE", path: `/employees/${rec.id}` },
      ],
      writeRoles: ["admin", "hr"],
    });
    await cleanup(k2("admin"), "DELETE", `/employees/${rec.id}`, "employee");
  }
}

// ── departments ──
section("departments");
{
  const rec = await create(k2("admin"), "/departments", { name: `Iso Dept ${stamp}`, code: `ISO${stamp % 1000000}` }, "department");
  if (rec) {
    await isolate({
      label: "department",
      needle: rec.id,
      owner: k2("admin"),
      list: "/departments",
      listRoles: ALL1,
      writes: [
        { method: "PUT", path: `/departments/${rec.id}`, body: { description: "leak" }, controlBody: { description: "iso" } },
        { method: "DELETE", path: `/departments/${rec.id}` },
      ],
      writeRoles: ["admin", "principal", "hr"],
    });
    await cleanup(k2("admin"), "DELETE", `/departments/${rec.id}`, "department");
  }
  // Foreign reference: an org-2 user as head of an org-1 department.
  if (scratch2) {
    await expectDenied("admin", "POST", "/departments", { name: `Iso Head ${stamp}`, head: scratch2 }, "made an org-2 user head of an org-1 department",
      async (r) => cleanup("admin", "DELETE", `/departments/${createdId(r.data)}`, "department"));
  }
}

// ── classes (+ enrollment into an org-2 class) ──
section("classes");
const class2 = await create(k2("admin"), "/classes", { name: `Iso Class ${stamp}`, subject: "Isolation" }, "class");
if (class2) {
  const C2 = class2.id;
  await isolate({
    label: "class",
    needle: C2,
    owner: k2("admin"),
    list: "/classes",
    listRoles: ALL1,
    gets: [`/classes/${C2}`],
    getRoles: ["admin", "principal", "teacher", "counselor", "student", "parent"],
    writes: [
      { method: "PUT", path: `/classes/${C2}`, body: { description: "leak" }, controlBody: { description: "iso" } },
      { method: "POST", path: `/classes/${C2}/enroll`, body: { studentId: student1 }, roles: ["admin", "principal", "counselor", "teacher"], what: "enrolled an org-1 student into an org-2 class" },
      { method: "DELETE", path: `/classes/${C2}/students/${student1}`, roles: ["admin", "counselor"] },
    ],
    writeRoles: ["admin", "principal", "teacher"],
  });
  await expectDenied("counselor", "POST", "/enrollments", { studentId: student1, classId: C2 }, "enrolled an org-1 student into an org-2 class via /enrollments",
    async (r) => cleanup("counselor", "DELETE", `/enrollments/${createdId(r.data)}`, "enrollment"));
  // (if this leaks, the class is deleted at the end of the academic section anyway)
  await expectDenied(k2("admin"), "POST", `/classes/${C2}/enroll`, { studentId: student1 }, "org-2 admin enrolled an org-1 student into its class");
  await expectDenied(k2("admin"), "POST", "/enrollments", { studentId: student1, classId: C2 }, "org-2 admin created an enrollment for an org-1 student",
    async (r) => cleanup(k2("admin"), "DELETE", `/enrollments/${createdId(r.data)}`, "enrollment"));
  if (scratch2) {
    await expectDenied("admin", "POST", "/classes", { name: `Iso Foreign Teacher ${stamp}`, subject: "Iso", teacherId: scratch2 }, "created an org-1 class taught by an org-2 user",
      async (r) => cleanup("admin", "DELETE", `/classes/${createdId(r.data)}`, "class"));
  }
}

// ── assignments ──
section("assignments");
if (class2) {
  const rec = await create(k2("admin"), "/assignments", { classId: class2.id, title: `Iso Assignment ${stamp}`, description: "iso", dueDate: future(7) }, "assignment");
  if (rec) {
    const A2 = rec.id;
    const published = await control(k2("admin"), "PUT", `/assignments/${A2}`, { status: "published" }, "publish assignment");
    await isolate({
      label: "assignment",
      needle: A2,
      owner: k2("admin"),
      list: "/assignments",
      listRoles: ["admin", "principal", "teacher", "counselor", "student", "parent"],
      gets: [`/assignments/${A2}`],
      getRoles: ["admin", "principal", "teacher", "counselor", "student", "parent"],
      writes: [
        { method: "PUT", path: `/assignments/${A2}`, body: { description: "leak" }, controlBody: { description: "iso b" } },
      ],
      writeRoles: ["admin", "principal", "teacher"],
    });
    if (published) {
      await expectDenied("student", "POST", "/submissions", { assignmentId: A2, content: `Iso leak ${stamp}` }, "submitted to an org-2 assignment");
    }
    await expectDenied("teacher", "POST", "/assignments", { classId: class2.id, title: `Iso Foreign Class ${stamp}` }, "created an assignment in an org-2 class",
      async (r) => cleanup("teacher", "DELETE", `/assignments/${createdId(r.data)}`, "assignment"));
    for (const key of ["admin", "principal", "teacher"]) await expectDenied(key, "DELETE", `/assignments/${A2}`, undefined, "deleted the other tenant's assignment");
    await cleanup(k2("admin"), "DELETE", `/assignments/${A2}`, "assignment");
  }
}

// ── tests + questions ──
section("tests");
if (class2) {
  const q = await create(k2("admin"), "/questions", {
    text: `Iso 2 + 2 ${stamp}?`, type: "single_choice", points: 5, status: "published",
    options: [{ text: "3", isCorrect: false }, { text: "4", isCorrect: true }], correctAnswer: "4",
  }, "question");
  const t = q && await create(k2("admin"), "/tests", {
    title: `Iso Test ${stamp}`, classId: class2.id, type: "quiz", durationMinutes: 10, totalPoints: 5, passingScore: 40, questionIds: [q.id],
  }, "test");
  if (q && t) {
    const published = await control(k2("admin"), "PUT", `/tests/${t.id}`, { status: "published" }, "publish test");
    await isolate({
      label: "test",
      needle: t.id,
      owner: k2("admin"),
      list: "/tests",
      listRoles: ["admin", "principal", "teacher", "counselor", "student", "parent"],
      gets: [`/tests/${t.id}`],
      getRoles: ["admin", "principal", "teacher", "counselor", "student", "parent"],
      writes: [{ method: "PUT", path: `/tests/${t.id}`, body: { description: "leak" }, controlBody: { description: "iso" } }],
      writeRoles: ["admin", "principal", "teacher"],
    });
    await isolate({
      label: "question",
      needle: q.id,
      owner: k2("admin"),
      list: "/questions",
      listRoles: ["admin", "principal", "teacher"],
      writes: [{ method: "PUT", path: `/questions/${q.id}`, body: { explanation: "leak" }, controlBody: { explanation: "iso" } }],
      writeRoles: ["admin", "principal", "teacher"],
    });
    if (published) {
      await expectDenied("student", "POST", `/attempts/${t.id}/start`, {}, "started an attempt on an org-2 test");
    }
    await expectDenied("teacher", "POST", "/tests", { title: `Iso Foreign Class Test ${stamp}`, classId: class2.id }, "created a test in an org-2 class",
      async (r) => cleanup("admin", "DELETE", `/tests/${createdId(r.data)}`, "test"));
    await expectDenied("teacher", "POST", "/tests", { title: `Iso Foreign Question Test ${stamp}`, questionIds: [q.id] }, "built a test from an org-2 question",
      async (r) => cleanup("admin", "DELETE", `/tests/${createdId(r.data)}`, "test"));
    for (const key of ["admin", "principal", "teacher"]) {
      await expectDenied(key, "DELETE", `/tests/${t.id}`, undefined, "deleted the other tenant's test");
      await expectDenied(key, "DELETE", `/questions/${q.id}`, undefined, "deleted the other tenant's question");
    }
  }
  if (t) await cleanup(k2("admin"), "DELETE", `/tests/${t.id}`, "test");
  if (q) await cleanup(k2("admin"), "DELETE", `/questions/${q.id}`, "question");
}

// ── study materials ──
section("study-materials");
{
  const rec = await create(k2("admin"), "/study-materials", {
    title: `Iso Material ${stamp}`, url: "https://example.com/iso.pdf", type: "link", visibility: "institute",
  }, "study material");
  if (rec) {
    await isolate({
      label: "study material",
      needle: rec.id,
      owner: k2("admin"),
      list: "/study-materials",
      listRoles: ALL1,
      writes: [
        { method: "PUT", path: `/study-materials/${rec.id}`, body: { description: "leak" }, controlBody: { description: "iso" } },
        { method: "DELETE", path: `/study-materials/${rec.id}` },
      ],
      writeRoles: ["admin", "principal", "teacher"],
    });
    await cleanup(k2("admin"), "DELETE", `/study-materials/${rec.id}`, "study material");
  }
  if (class2) {
    await expectDenied("teacher", "POST", "/study-materials", { title: `Iso Foreign ${stamp}`, url: "https://example.com/x.pdf", classId: class2.id, visibility: "class_only" },
      "attached a material to an org-2 class", async (r) => cleanup("teacher", "DELETE", `/study-materials/${createdId(r.data)}`, "study material"));
  }
}

if (class2) {
  family = "classes";
  for (const key of ["admin", "principal", "teacher"]) await expectDenied(key, "DELETE", `/classes/${class2.id}`, undefined, "deleted the other tenant's class");
  await cleanup(k2("admin"), "DELETE", `/classes/${class2.id}`, "class");
}

// ── attendance ──
section("attendance");
if (scratch2) {
  const r = await call(k2("admin"), "POST", "/attendance", { date: "2001-01-01", records: [{ userId: scratch2, status: "present", notes: `iso ${stamp}` }] });
  const recId = ok2xx(r.status) ? createdId(r.data) : null;
  if (!recId) setup("admin@2 POST /attendance (mark scratch employee)", r);
  else {
    await isolate({
      label: "attendance record",
      needle: recId,
      owner: k2("admin"),
      list: ["/attendance", "/attendance?month=1&year=2001"],
      listRoles: ["admin", "principal", "hr", "teacher"],
    });
    leftovers.push("[attendance] org-2 attendance row for the scratch user on 2001-01-01 (no delete route)");
  }
  await expectDenied("admin", "POST", "/attendance", { date: "2001-01-02", records: [{ userId: scratch2, status: "present" }] }, "marked attendance for an org-2 user",
    async () => leftovers.push("[attendance] org-1 attendance row for an org-2 user on 2001-01-02 (no delete route)"));
}

// ── leaves ──
section("leaves");
{
  const day = new Date(Date.UTC(2090, 0, 1) + (stamp % 3000) * 86400000).toISOString().slice(0, 10);
  const rec = await create(k2("employee"), "/leaves", { type: "unpaid", startDate: day, endDate: day, reason: `Iso leave ${stamp}` }, "leave");
  if (rec) {
    await isolate({
      label: "leave",
      needle: rec.id,
      owner: k2("employee"),
      list: "/leaves",
      listRoles: ["admin", "principal", "hr", "employee", "teacher", "accountant", "support"],
      writes: [
        { method: "PUT", path: `/leaves/${rec.id}/status`, body: { status: "rejected", rejectionReason: "leak" }, roles: ["admin", "principal", "hr"] },
        { method: "PUT", path: `/leaves/${rec.id}/cancel`, body: { reason: "leak" }, roles: ["admin", "hr", "employee"] },
      ],
    });
    const done = await cleanup(k2("employee"), "PUT", `/leaves/${rec.id}/cancel`, "leave (cancel)");
    if (ok2xx(done.status)) console.log("ok    [leaves] control: employee@2 cancels its own leave (status/cancel routes exist)");
  }
  if (scratch2) {
    await expectDenied("hr", "PUT", `/leaves/balances/${scratch2}/adjust`, { leaveType: "casual", adjustment: 1 }, "adjusted an org-2 user's leave balance",
      async () => call("hr", "PUT", `/leaves/balances/${scratch2}/adjust`, { leaveType: "casual", adjustment: -1 }));
  }
}

// ── salary structures + payroll ──
section("salary-structures");
const salary2 = await create(k2("hr"), "/salary-structures", { name: `Iso Salary ${stamp}`, baseSalary: 1000 }, "salary structure");
if (salary2) {
  await isolate({
    label: "salary structure",
    needle: salary2.id,
    owner: k2("hr"),
    list: "/salary-structures",
    listRoles: ["admin", "principal", "hr", "accountant"],
    writes: [
      { method: "PUT", path: `/salary-structures/${salary2.id}`, body: { name: "Leaked" }, controlBody: { name: `Iso Salary ${stamp} b` } },
      { method: "DELETE", path: `/salary-structures/${salary2.id}` },
    ],
    writeRoles: ["admin", "hr"],
  });
  await expectDenied("hr", "PUT", `/payroll/salary-assignments/${employee1}`, { salaryStructureId: salary2.id }, "assigned an org-2 salary structure to an org-1 employee",
    async () => call("hr", "PUT", `/payroll/salary-assignments/${employee1}`, { salaryStructureId: null }));
  if (scratch2) {
    await expectDenied("hr", "PUT", `/payroll/salary-assignments/${scratch2}`, { salaryStructureId: null }, "changed an org-2 employee's salary assignment");
  }
  await cleanup(k2("admin"), "DELETE", `/salary-structures/${salary2.id}`, "salary structure");
}

section("payroll");
if (scratch2) {
  const month = 1 + (stamp % 12);
  const year = 2100 + (stamp % 90);
  const rec = await create(k2("hr"), "/payroll", { employeeId: scratch2, month, year, basicSalary: 1000 }, "payroll");
  if (rec) {
    await isolate({
      label: "payroll",
      needle: rec.id,
      owner: k2("hr"),
      list: "/payroll",
      listRoles: ["admin", "principal", "hr", "accountant", "employee", "teacher"],
      gets: [`/payroll/${rec.id}`],
      getRoles: ["admin", "principal", "hr", "accountant", "employee"],
      writes: [
        { method: "PUT", path: `/payroll/${rec.id}/status`, body: { status: "processed" } },
        { method: "DELETE", path: `/payroll/${rec.id}` },
      ],
      writeRoles: ["admin", "hr"],
    });
    await cleanup(k2("hr"), "DELETE", `/payroll/${rec.id}`, "payroll");
  }
  await expectDenied("hr", "POST", "/payroll", { employeeId: scratch2, month: 1 + ((stamp + 1) % 12), year, basicSalary: 1000 }, "created a payroll for an org-2 user",
    async (r) => cleanup("hr", "DELETE", `/payroll/${createdId(r.data)}`, "payroll"));
}

// ── performance reviews ──
section("reviews");
if (scratch2) {
  const rec = await create(k2("hr"), "/reviews", { employeeId: scratch2, title: `Iso Review ${stamp}`, type: "annual" }, "review");
  if (rec) {
    await isolate({
      label: "review",
      needle: rec.id,
      owner: k2("hr"),
      list: "/reviews",
      listRoles: ["admin", "principal", "hr", "employee"],
      writes: [
        { method: "PUT", path: `/reviews/${rec.id}`, body: { title: "Leaked" }, controlBody: { title: `Iso Review ${stamp} b` } },
        { method: "DELETE", path: `/reviews/${rec.id}` },
      ],
      writeRoles: ["admin", "principal", "hr"],
    });
    await cleanup(k2("admin"), "DELETE", `/reviews/${rec.id}`, "review");
  }
  await expectDenied("hr", "POST", "/reviews", { employeeId: scratch2, title: `Iso Foreign Review ${stamp}` }, "created a review for an org-2 user",
    async (r) => cleanup("hr", "DELETE", `/reviews/${createdId(r.data)}`, "review"));
}

// ── certificates ──
section("certificates");
if (scratch2) {
  const rec = await create(k2("hr"), "/certificates", { userId: scratch2, title: `Iso Certificate ${stamp}`, type: "completion" }, "certificate");
  if (rec) {
    await isolate({
      label: "certificate",
      needle: rec.id,
      owner: k2("hr"),
      list: "/certificates",
      listRoles: ["admin", "principal", "hr", "employee", "teacher", "student"],
      writes: [
        { method: "PUT", path: `/certificates/${rec.id}/revoke`, body: { reason: "leak" } },
        { method: "DELETE", path: `/certificates/${rec.id}` },
      ],
      writeRoles: ["admin", "principal", "hr"],
    });
    await cleanup(k2("admin"), "DELETE", `/certificates/${rec.id}`, "certificate");
  }
  await expectDenied("hr", "POST", "/certificates", { userId: scratch2, title: `Iso Foreign Certificate ${stamp}` }, "issued a certificate to an org-2 user",
    async (r) => cleanup("hr", "DELETE", `/certificates/${createdId(r.data)}`, "certificate"));
}

// ── employee documents ──
section("employee-documents");
if (scratch2) {
  const rec = await create(k2("hr"), "/employee-documents", {
    employeeUserId: scratch2, title: `Iso Document ${stamp}`, type: "identity", fileUrl: "https://example.com/iso.pdf",
  }, "employee document");
  if (rec) {
    await isolate({
      label: "employee document",
      needle: rec.id,
      owner: k2("hr"),
      list: "/employee-documents",
      listRoles: ["admin", "principal", "hr", "employee"],
      writes: [
        { method: "PUT", path: `/employee-documents/${rec.id}`, body: { description: "leak" }, controlBody: { description: "iso" } },
        { method: "DELETE", path: `/employee-documents/${rec.id}` },
      ],
      writeRoles: ["admin", "hr"],
    });
    await cleanup(k2("hr"), "DELETE", `/employee-documents/${rec.id}`, "employee document");
  }
  await expectDenied("hr", "POST", "/employee-documents", {
    employeeUserId: scratch2, title: `Iso Foreign Doc ${stamp}`, type: "identity", fileUrl: "https://example.com/x.pdf",
  }, "filed a document for an org-2 user", async (r) => cleanup("hr", "DELETE", `/employee-documents/${createdId(r.data)}`, "employee document"));
}

// ── geofences ──
section("geofences");
{
  const rec = await create(k2("admin"), "/geofences", { name: `Iso Fence ${stamp}`, latitude: 1, longitude: 1, radiusMeters: 100 }, "geofence");
  if (rec) {
    await isolate({
      label: "geofence",
      needle: rec.id,
      owner: k2("admin"),
      list: "/geofences",
      listRoles: ["admin", "principal", "hr", "employee", "teacher"],
      writes: [
        { method: "PUT", path: `/geofences/${rec.id}`, body: { description: "leak" }, controlBody: { description: "iso" } },
        { method: "DELETE", path: `/geofences/${rec.id}` },
      ],
      writeRoles: ["admin", "principal", "hr"],
    });
    await cleanup(k2("admin"), "DELETE", `/geofences/${rec.id}`, "geofence");
  }
}

// ── invoices + payments ──
section("invoices");
if (scratch2) {
  const rec = await create(k2("accountant"), "/invoices", {
    employeeId: scratch2, notes: `Iso invoice ${stamp}`, lineItems: [{ description: "Iso", quantity: 1, unitPrice: 1000 }],
  }, "invoice");
  if (rec) {
    const I2 = rec.id;
    const invoiceMongoId = rec.data?._id;
    await isolate({
      label: "invoice",
      needle: I2,
      owner: k2("accountant"),
      list: "/invoices",
      listRoles: ["admin", "principal", "accountant", "student", "parent", "employee"],
      gets: [`/invoices/${I2}`],
      getRoles: ["admin", "principal", "accountant", "student", "parent", "employee"],
      writes: [
        { method: "PUT", path: `/invoices/${I2}/status`, body: { status: "cancelled" }, controlBody: { status: "issued" } },
        { method: "POST", path: `/invoices/${I2}/payments`, body: { amount: 1, method: "cash" }, what: "recorded a payment on an org-2 invoice" },
      ],
      writeRoles: ["admin", "accountant"],
    });
    for (const key of ["accountant", "admin", "student"]) {
      await expectDenied(key, "POST", "/payments/razorpay/order", { invoiceId: I2 }, "opened a checkout order for an org-2 invoice");
    }

    section("payments");
    const paid = await call(k2("accountant"), "POST", `/invoices/${I2}/payments`, { amount: 100, method: "cash", reference: `iso-${stamp}` });
    let P2 = null;
    if (!ok2xx(paid.status)) setup("accountant@2 records a payment", paid);
    else {
      const pays = await call(k2("accountant"), "GET", "/payments?limit=100");
      const rows = Array.isArray(pays.data) ? pays.data : pays.data?.payments ?? [];
      P2 = id(rows.find((p) => JSON.stringify(p).includes(I2) || (invoiceMongoId && JSON.stringify(p).includes(invoiceMongoId))));
      if (!P2) setup("find the org-2 payment in GET /payments", pays);
    }
    if (P2) {
      await isolate({
        label: "payment",
        needle: P2,
        owner: k2("accountant"),
        list: "/payments",
        listRoles: ["admin", "principal", "accountant", "student", "parent", "employee"],
        gets: [`/payments/${P2}`],
        getRoles: ["admin", "principal", "accountant", "student", "parent", "employee"],
        writes: [{ method: "POST", path: `/payments/${P2}/refund`, body: { amount: 1, reason: "leak" }, what: "refunded an org-2 payment" }],
        writeRoles: ["admin", "accountant"],
      });
      await cleanup(k2("accountant"), "POST", `/payments/${P2}/refund`, "payment refund");
      leftovers.push("[payments] org-2 payment record (refunded; payments have no delete route)");
    }

    family = "invoices";
    for (const key of ["admin", "accountant"]) await expectDenied(key, "DELETE", `/invoices/${I2}`, undefined, "deleted the other tenant's invoice");
    await cleanup(k2("admin"), "DELETE", `/invoices/${I2}`, "invoice");
  }
  if (student1) {
    await expectDenied(k2("accountant"), "POST", "/invoices", { studentId: student1, lineItems: [{ description: "Iso", quantity: 1, unitPrice: 1 }] },
      "org-2 accountant billed an org-1 student", async (r) => cleanup(k2("admin"), "DELETE", `/invoices/${createdId(r.data)}`, "invoice"));
  }
}

// ── CRM ──
section("leads");
const lead2 = await create(k2("admin"), "/leads", { firstName: "Iso", lastName: `Lead ${stamp}`, email: `iso-${stamp}-lead@example.com`, source: "manual" }, "lead");
const CRM_READ = ["admin", "principal", "counselor", "support", "accountant"];
const CRM_WRITE = ["admin", "counselor"];
if (lead2) {
  await isolate({
    label: "lead",
    needle: lead2.id,
    owner: k2("admin"),
    list: "/leads",
    listRoles: CRM_READ,
    gets: [`/leads/${lead2.id}`],
    getRoles: CRM_READ,
    writes: [{ method: "PUT", path: `/leads/${lead2.id}`, body: { notes: "leak" }, controlBody: { notes: "iso" } }],
    writeRoles: CRM_WRITE,
  });
}

section("deals");
if (lead2) {
  const rec = await create(k2("admin"), "/deals", { title: `Iso Deal ${stamp}`, leadId: lead2.id, value: 100 }, "deal");
  if (rec) {
    await isolate({
      label: "deal",
      needle: rec.id,
      owner: k2("admin"),
      list: "/deals",
      listRoles: CRM_READ,
      writes: [
        { method: "PUT", path: `/deals/${rec.id}/stage`, body: { stage: "negotiation" }, controlBody: { stage: "proposal" } },
        { method: "DELETE", path: `/deals/${rec.id}` },
      ],
      writeRoles: CRM_WRITE,
    });
    await cleanup(k2("admin"), "DELETE", `/deals/${rec.id}`, "deal");
  }
  await expectDenied("counselor", "POST", "/deals", { title: `Iso Foreign Deal ${stamp}`, leadId: lead2.id }, "created a deal on an org-2 lead",
    async (r) => cleanup("counselor", "DELETE", `/deals/${createdId(r.data)}`, "deal"));
}

const crmChild = async (name, path, body, put, extraWrites = []) => {
  section(name);
  const rec = await create(k2("admin"), path, body, name);
  if (!rec) return;
  await isolate({
    label: name,
    needle: rec.id,
    owner: k2("admin"),
    list: path,
    listRoles: CRM_READ,
    writes: [
      { method: "PUT", path: `${path}/${rec.id}`, body: put.leak, controlBody: put.iso },
      ...extraWrites.map((w) => ({ ...w, path: `${path}/${rec.id}${w.suffix}` })),
      { method: "DELETE", path: `${path}/${rec.id}` },
    ],
    writeRoles: CRM_WRITE,
  });
  await cleanup(k2("admin"), "DELETE", `${path}/${rec.id}`, name);
};

await crmChild("contacts", "/contacts", { firstName: "Iso", lastName: `Contact ${stamp}`, email: `iso-${stamp}-c@example.com`, type: "individual" },
  { leak: { description: "leak" }, iso: { description: "iso" } });
await crmChild("customers", "/customers", { firstName: "Iso", lastName: `Customer ${stamp}`, email: `iso-${stamp}-cu@example.com`, type: "individual" },
  { leak: { notes: "leak" }, iso: { notes: "iso" } });
if (lead2) {
  await crmChild("crm-activities", "/crm-activities", { type: "call", subject: `Iso Call ${stamp}`, leadId: lead2.id },
    { leak: { description: "leak" }, iso: { description: "iso" } });
  await crmChild("crm-tasks", "/crm-tasks", { title: `Iso Task ${stamp}`, leadId: lead2.id },
    { leak: { description: "leak" }, iso: { description: "iso" } },
    [{ method: "PATCH", suffix: "/complete", body: { completed: true, notes: "leak" } }]);
  await crmChild("crm-notes", "/crm-notes", { body: `Iso note ${stamp}`, leadId: lead2.id },
    { leak: { body: "leak" }, iso: { body: `Iso note ${stamp} b` } });

  family = "crm-foreign-refs";
  await expectDenied("counselor", "POST", "/crm-activities", { type: "call", subject: `Iso Foreign ${stamp}`, leadId: lead2.id }, "logged an activity on an org-2 lead",
    async (r) => cleanup("counselor", "DELETE", `/crm-activities/${createdId(r.data)}`, "activity"));
  await expectDenied("counselor", "POST", "/crm-notes", { body: `Iso Foreign ${stamp}`, leadId: lead2.id }, "added a note to an org-2 lead",
    async (r) => cleanup("counselor", "DELETE", `/crm-notes/${createdId(r.data)}`, "note"));
  if (scratch2) {
    await expectDenied("counselor", "POST", "/crm-tasks", { title: `Iso Foreign Assignee ${stamp}`, assignee: scratch2 }, "assigned a CRM task to an org-2 user",
      async (r) => cleanup("counselor", "DELETE", `/crm-tasks/${createdId(r.data)}`, "task"));
  }
}

section("pipelines");
{
  const rec = await create(k2("admin"), "/pipelines", { name: `Iso Pipeline ${stamp}`, type: "sales", stages: ["New", "Won"] }, "pipeline");
  if (rec) {
    await isolate({
      label: "pipeline",
      needle: rec.id,
      owner: k2("admin"),
      list: "/pipelines",
      listRoles: CRM_READ,
      writes: [{ method: "DELETE", path: `/pipelines/${rec.id}` }],
      writeRoles: CRM_WRITE,
    });
    await cleanup(k2("admin"), "DELETE", `/pipelines/${rec.id}`, "pipeline");
  }
}

if (lead2) {
  family = "leads";
  for (const key of CRM_WRITE) await expectDenied(key, "DELETE", `/leads/${lead2.id}`, undefined, "deleted the other tenant's lead");
  await cleanup(k2("admin"), "DELETE", `/leads/${lead2.id}`, "lead");
}

// ── tickets ──
section("tickets");
{
  const rec = await create(k2("support"), "/tickets", { subject: `Iso Ticket ${stamp}`, description: "iso" }, "ticket");
  const TICKET_READ = ["admin", "principal", "support", "employee", "student", "teacher", "parent"];
  if (rec) {
    const K2 = rec.id;
    await isolate({
      label: "ticket",
      needle: K2,
      owner: k2("support"),
      list: "/tickets",
      listRoles: TICKET_READ,
      gets: [`/tickets/${K2}`, `/tickets/${K2}/assignees`],
      getRoles: ["admin", "support", "employee", "student"],
      writes: [
        { method: "PUT", path: `/tickets/${K2}`, body: { priority: "urgent" }, controlBody: { priority: "high" }, roles: ["admin", "support"] },
        { method: "PUT", path: `/tickets/${K2}`, body: { assigneeId: support1 }, roles: ["admin", "support"], what: "assigned an org-2 ticket" },
        { method: "POST", path: `/tickets/${K2}/messages`, body: { body: `Iso leak reply ${stamp}` }, roles: ["admin", "support", "employee", "student"], what: "replied to an org-2 ticket" },
        { method: "DELETE", path: `/tickets/${K2}`, roles: ["admin"] },
      ],
    });
    if (support1) {
      await expectDenied(k2("support"), "PUT", `/tickets/${K2}`, { assigneeId: support1 }, "org-2 support assigned its ticket to an org-1 user");
    }
    await cleanup(k2("admin"), "DELETE", `/tickets/${K2}`, "ticket");
  }
  // Org-1 ticket assigned to an org-2 user.
  const own = await create("support", "/tickets", { subject: `Iso Own Ticket ${stamp}`, description: "iso" }, "org-1 ticket");
  if (own && support2) {
    await expectDenied("support", "PUT", `/tickets/${own.id}`, { assigneeId: support2 }, "assigned an org-1 ticket to an org-2 user");
  }
  if (own) await cleanup("admin", "DELETE", `/tickets/${own.id}`, "org-1 ticket");
}

section("ticket-templates");
{
  const rec = await create(k2("support"), "/tickets/templates", { name: `Iso Template ${stamp}`, body: "iso" }, "ticket template");
  if (rec) {
    await isolate({
      label: "ticket template",
      needle: rec.id,
      owner: k2("support"),
      list: "/tickets/templates",
      listRoles: ["admin", "support", "principal"],
      writes: [
        { method: "PUT", path: `/tickets/templates/${rec.id}`, body: { body: "leak" }, controlBody: { body: "iso b" } },
        { method: "DELETE", path: `/tickets/templates/${rec.id}` },
      ],
      writeRoles: ["admin", "support"],
    });
    await cleanup(k2("support"), "DELETE", `/tickets/templates/${rec.id}`, "ticket template");
  }
}

// ── events ──
section("events");
{
  const rec = await create(k2("admin"), "/events", { title: `Iso Event ${stamp}`, startsAt: future(30), description: "iso" }, "event");
  if (rec) {
    await isolate({
      label: "event",
      needle: rec.id,
      owner: k2("admin"),
      list: "/events",
      listRoles: ALL1,
      gets: [`/events/${rec.id}`],
      getRoles: ALL1,
      writes: [
        { method: "PUT", path: `/events/${rec.id}`, body: { description: "leak" }, controlBody: { description: "iso b" } },
        { method: "DELETE", path: `/events/${rec.id}` },
      ],
      writeRoles: ["admin", "principal", "hr", "teacher"],
    });
    await cleanup(k2("admin"), "DELETE", `/events/${rec.id}`, "event");
  } else {
    // Creation is broken; fall back to read-only checks on an existing org-2 event.
    const existing = id(((await call(k2("admin"), "GET", "/events?limit=100")).data ?? [])[0]);
    if (existing) {
      console.log("      (using an existing org-2 event, read-only checks)");
      await isolate({ label: "event", needle: existing, owner: k2("admin"), list: "/events", listRoles: ALL1, gets: [`/events/${existing}`], getRoles: ALL1 });
    } else setup("no existing org-2 event to fall back on; event checks skipped", null);
  }
}

// ── announcements ──
section("announcements");
{
  const rec = await create(k2("admin"), "/announcements", { title: `Iso Announcement ${stamp}`, content: "iso", targetRoles: ["all"] }, "announcement");
  if (rec) {
    await isolate({
      label: "announcement",
      needle: rec.id,
      owner: k2("admin"),
      list: "/announcements",
      listRoles: ALL1,
      gets: [`/announcements/${rec.id}`],
      getRoles: ALL1,
      writes: [
        { method: "PUT", path: `/announcements/${rec.id}`, body: { content: "leak" }, controlBody: { content: "iso b" } },
        { method: "DELETE", path: `/announcements/${rec.id}` },
      ],
      writeRoles: ["admin", "principal", "hr", "teacher"],
    });
    await cleanup(k2("admin"), "DELETE", `/announcements/${rec.id}`, "announcement");
  }
}

// ── conversations + messages ──
section("conversations");
if (hr2) {
  const conv = await create(k2("admin"), "/conversations/group", { title: `Iso Group ${stamp}`, participantIds: [hr2] }, "group conversation");
  if (conv) {
    const V2 = conv.id;
    const msg = await create(k2("admin"), `/conversations/${V2}/messages`, { text: `Iso message ${stamp}` }, "message");
    const CONV_ROLES = ["admin", "principal", "support", "teacher", "student", "hr"];
    await isolate({
      label: "conversation",
      needle: V2,
      owner: k2("admin"),
      list: "/conversations",
      listRoles: ALL1,
      gets: [`/conversations/${V2}`, `/conversations/${V2}/messages`],
      getRoles: CONV_ROLES,
      writes: [
        { method: "POST", path: `/conversations/${V2}/messages`, body: { text: `Iso leak ${stamp}` }, what: "posted into an org-2 conversation" },
        ...(support1 ? [{ method: "POST", path: `/conversations/${V2}/participants`, body: { userIds: [support1] }, what: "joined org-1 users to an org-2 conversation" }] : []),
        { method: "POST", path: `/conversations/${V2}/read`, body: {}, what: "marked an org-2 conversation read" },
      ],
      writeRoles: CONV_ROLES,
    });
    if (msg) {
      await isolate({
        label: "message",
        needle: msg.id,
        owner: k2("admin"),
        list: `/conversations/${V2}/messages`,
        listRoles: [],
        writes: [
          { method: "PUT", path: `/messages/${msg.id}`, body: { text: "leak" }, controlBody: { text: `Iso message ${stamp} edited` } },
          { method: "DELETE", path: `/messages/${msg.id}` },
        ],
        writeRoles: CONV_ROLES,
      });
    }
    for (const key of CONV_ROLES) await expectDenied(key, "POST", `/conversations/${V2}/leave`, {}, "left (modified) an org-2 conversation");
    if (admin1) {
      await expectDenied(k2("admin"), "POST", `/conversations/${V2}/participants`, { userIds: [admin1] }, "org-2 admin added an org-1 user to its conversation");
    }
    if (msg) await cleanup(k2("admin"), "DELETE", `/messages/${msg.id}`, "message");
    leftovers.push("[conversations] org-2 group conversation with hr@2 (no delete route)");
  }
  if (admin2) {
    await expectDenied("admin", "POST", "/conversations/direct", { userId: admin2 }, "opened a direct conversation with an org-2 user",
      async () => leftovers.push("[conversations] org-1 direct conversation with the org-2 admin"));
    await expectDenied("admin", "POST", "/conversations/group", { title: `Iso Foreign Group ${stamp}`, participantIds: [admin2] }, "created a group with an org-2 user",
      async () => leftovers.push("[conversations] org-1 group conversation containing the org-2 admin"));
  }
}

/* ═════════════════════ org 1 owns, org 2 must not see ═════════════════════ */

section("students (reverse)");
const isoStudent = await createUser("admin", {
  name: `Iso Student ${stamp}`,
  email: `iso-${stamp}-student@demo.paisa.test`,
  password: PASSWORD,
  role: "student",
  student: { course: "Isolation" },
}, "org-1 student user");
let studentProfile = null;
if (isoStudent) {
  const S1 = isoStudent.id;
  const list = await call("admin", "GET", "/students?limit=100");
  studentProfile = id((list.data ?? []).find((s) => JSON.stringify(s).includes(S1) || JSON.stringify(s).includes(`iso-${stamp}-student`)));
  if (!studentProfile) setup("find the new student profile in GET /students", list);
  else {
    await isolate({
      label: "student profile",
      needle: studentProfile,
      owner: "admin",
      list: "/students",
      listRoles: ALL2,
      gets: [`/students/${studentProfile}`],
      getRoles: ALL2,
      writes: [
        { method: "PUT", path: `/students/${studentProfile}`, body: { section: "Z" }, controlBody: { section: "A" } },
        { method: "DELETE", path: `/students/${studentProfile}` },
      ],
      writeRoles: [k2("admin"), k2("hr")],
    });
    // Parent links: an org-2 user as guardian of an org-1 student.
    if (scratch2) {
      await expectDenied("admin", "PUT", `/students/${studentProfile}`, { guardianUserIds: [scratch2] }, "linked an org-2 user as guardian of an org-1 student",
        async () => call("admin", "PUT", `/students/${studentProfile}`, { guardianUserIds: [] }));
    }
  }
  family = "users (reverse)";
  await isolate({
    label: "org-1 user",
    needle: S1,
    owner: "admin",
    list: "/users",
    listRoles: ALL2,
    gets: [`/users/${S1}`, `/users/${S1}/detail`],
    getRoles: ALL2,
    writes: [{ method: "PUT", path: `/users/${S1}`, body: { name: "Leaked" }, controlBody: { name: `Iso Student ${stamp} b` } }],
    writeRoles: [k2("admin"), k2("hr")],
  });
}

section("teachers (reverse)");
const isoTeacher = await createUser("admin", {
  name: `Iso Teacher ${stamp}`,
  email: `iso-${stamp}-teacher@demo.paisa.test`,
  password: PASSWORD,
  role: "teacher",
  teacher: { subject: "Isolation" },
}, "org-1 teacher user");
if (isoTeacher) {
  // GET /teachers populates userId with name/email only, so search by the email.
  await isolate({ label: "teacher", needle: isoTeacher.email, owner: "admin", list: "/teachers", listRoles: ALL2 });
  await expectDenied(k2("admin"), "POST", "/teachers", { userId: isoTeacher.id, subject: "Leak" }, "created a teacher profile for an org-1 user");
}

// Class, enrollment, assignment + submission, test + attempt, all in org 1.
section("enrollments (reverse)");
const class1 = await create("admin", "/classes", { name: `Iso Org1 Class ${stamp}`, subject: "Isolation" }, "org-1 class");
let enrollment1 = null;
if (class1 && isoStudent) {
  enrollment1 = await create("admin", "/enrollments", { studentId: isoStudent.id, classId: class1.id }, "org-1 enrollment");
  if (enrollment1) {
    await isolate({
      label: "enrollment",
      needle: enrollment1.id,
      owner: "admin",
      list: "/enrollments",
      listRoles: ALL2,
      writes: [
        { method: "PUT", path: `/enrollments/${enrollment1.id}/status`, body: { status: "withdrawn" }, controlBody: { status: "active" } },
        { method: "DELETE", path: `/enrollments/${enrollment1.id}` },
      ],
      writeRoles: [k2("admin"), k2("hr")],
    });
  } else {
    // Creation is broken; fall back to a list-only check on an existing org-1 enrollment.
    const existing = id(((await call("admin", "GET", "/enrollments?limit=100")).data ?? [])[0]);
    if (existing) {
      console.log("      (using an existing org-1 enrollment, list-only check)");
      await isolate({ label: "enrollment", needle: existing, owner: "admin", list: "/enrollments", listRoles: ALL2 });
    } else setup("no existing org-1 enrollment to fall back on; enrollment checks skipped", null);
  }
  family = "classes (reverse)";
  await isolate({
    label: "org-1 class",
    needle: class1.id,
    owner: "admin",
    list: "/classes",
    listRoles: ALL2,
    gets: [`/classes/${class1.id}`],
    getRoles: ALL2,
    writes: [
      { method: "PUT", path: `/classes/${class1.id}`, body: { description: "leak" }, controlBody: { description: "iso" } },
      { method: "DELETE", path: `/classes/${class1.id}/students/${isoStudent.id}` },
    ],
    writeRoles: [k2("admin")],
  });
}

let studentLoggedIn = false;
if (isoStudent) studentLoggedIn = await login("isoStudent", isoStudent.email);
if (class1 && studentLoggedIn) {
  family = "classes (reverse)";
  studentLoggedIn = await control("admin", "POST", `/classes/${class1.id}/enroll`, { studentId: isoStudent.id }, "enroll throwaway student in org-1 class");
}

section("submissions (reverse)");
let assignment1 = null;
if (class1 && studentLoggedIn) {
  assignment1 = await create("admin", "/assignments", { classId: class1.id, title: `Iso Org1 Assignment ${stamp}`, dueDate: future(7) }, "org-1 assignment");
  if (assignment1 && await control("admin", "PUT", `/assignments/${assignment1.id}`, { status: "published" }, "publish org-1 assignment")) {
    const sub = await create("isoStudent", "/submissions", { assignmentId: assignment1.id, content: `Iso answer ${stamp}` }, "org-1 submission");
    if (sub) {
      await isolate({
        label: "submission",
        needle: sub.id,
        owner: "admin",
        list: "/submissions",
        listRoles: ALL2,
        gets: [`/submissions/${sub.id}`],
        getRoles: ALL2,
        writes: [{ method: "PUT", path: `/submissions/${sub.id}/grade`, body: { score: 1, feedback: "leak" }, controlBody: { score: 5, feedback: "iso" } }],
        writeRoles: [k2("admin"), k2("hr")],
      });
      leftovers.push("[submissions] org-1 submission of the throwaway student (no delete route)");
    }
    family = "assignments (reverse)";
    await isolate({
      label: "org-1 assignment",
      needle: assignment1.id,
      owner: "admin",
      list: "/assignments",
      listRoles: ALL2,
      gets: [`/assignments/${assignment1.id}`],
      getRoles: ALL2,
      writes: [{ method: "DELETE", path: `/assignments/${assignment1.id}` }],
      writeRoles: [k2("admin")],
    });
  }
}

section("attempts (reverse)");
let question1 = null;
let test1 = null;
if (class1 && studentLoggedIn) {
  question1 = await create("admin", "/questions", {
    text: `Iso org-1 question ${stamp}?`, type: "single_choice", points: 5, status: "published",
    options: [{ text: "yes", isCorrect: true }, { text: "no", isCorrect: false }], correctAnswer: "yes",
  }, "org-1 question");
  test1 = question1 && await create("admin", "/tests", {
    title: `Iso Org1 Test ${stamp}`, classId: class1.id, type: "quiz", durationMinutes: 10, totalPoints: 5, passingScore: 40, questionIds: [question1.id],
  }, "org-1 test");
  if (test1 && await control("admin", "PUT", `/tests/${test1.id}`, { status: "published" }, "publish org-1 test")) {
    const att = await create("isoStudent", `/attempts/${test1.id}/start`, {}, "org-1 attempt");
    if (att) {
      const sub = await call("isoStudent", "PUT", `/attempts/${att.id}/submit`, { answers: [{ questionId: question1.id, answer: "yes" }] });
      if (!ok2xx(sub.status)) setup("submit org-1 attempt", sub);
      await isolate({
        label: "attempt",
        needle: att.id,
        owner: "admin",
        list: ["/attempts", `/attempts?testId=${test1.id}`],
        listRoles: ALL2,
        writes: [
          { method: "PUT", path: `/attempts/${att.id}/grade`, body: { score: 0, feedback: "leak" }, controlBody: { score: 5, feedback: "iso" } },
          { method: "PUT", path: `/attempts/${att.id}/submit`, body: { answers: [] } },
        ],
        writeRoles: [k2("admin"), k2("hr")],
      });
      leftovers.push("[attempts] org-1 attempt of the throwaway student (no delete route)");
    }
    family = "tests (reverse)";
    await isolate({
      label: "org-1 test",
      needle: test1.id,
      owner: "admin",
      list: "/tests",
      listRoles: ALL2,
      gets: [`/tests/${test1.id}`],
      getRoles: ALL2,
      writes: [
        { method: "POST", path: `/attempts/${test1.id}/start`, body: {}, what: "started an attempt on an org-1 test" },
        { method: "DELETE", path: `/tests/${test1.id}`, roles: [k2("admin")] },
      ],
      writeRoles: ALL2,
    });
  }
}

// Reverse cleanup (org 1).
section("cleanup (org 1)");
if (test1) await cleanup("admin", "DELETE", `/tests/${test1.id}`, "org-1 test");
if (question1) await cleanup("admin", "DELETE", `/questions/${question1.id}`, "org-1 question");
if (assignment1) await cleanup("admin", "DELETE", `/assignments/${assignment1.id}`, "org-1 assignment");
if (enrollment1) await cleanup("admin", "DELETE", `/enrollments/${enrollment1.id}`, "org-1 enrollment");
if (class1) await cleanup("admin", "DELETE", `/classes/${class1.id}`, "org-1 class");
if (studentProfile) await cleanup("admin", "DELETE", `/students/${studentProfile}`, "org-1 student profile");
if (isoStudent) await cleanup("admin", "DELETE", `/users/${isoStudent.id}`, "org-1 student user");
if (isoTeacher) await cleanup("admin", "DELETE", `/users/${isoTeacher.id}`, "org-1 teacher user");

/* ═════════════════════ mass assignment: body instituteId ═════════════════════ */

const massAssign = async ({ label, key = "admin", path, body, list = path, del = (newId) => `${path}/${newId}` }) => {
  section(`mass-assign ${label}`);
  for (const ref of org2Refs) {
    const r = await call(key, "POST", path, { ...body(), instituteId: ref });
    const name = `POST ${path} as ${key} with instituteId=${ref} keeps the ${label} in org 1`;
    if (r.status >= 500) {
      check(name, false, `${r.status} ERROR ${r.message}`);
      errors.push(`[${family}] POST /api${path} as ${key} with org-2 instituteId: ${r.status} ${r.message}`);
      continue;
    }
    if (!ok2xx(r.status)) {
      check(name, true, `rejected ${r.status} ${r.message}`);
      continue;
    }
    const newId = createdId(r.data);
    const inst = r.data?.instituteId ?? Object.values(r.data ?? {}).find((v) => v?.instituteId)?.instituteId;
    const instRefs = refsOf(inst);
    const inOrg2 = instRefs.some((x) => org2Refs.includes(x));
    const seenBy2 = newId ? await listed(k2("admin"), list, newId) : false;
    const seenBy1 = newId ? await listed(key, list, newId) : false;
    if (inOrg2 || seenBy2) {
      check(name, false, "LEAK");
      leaks.push(`POST /api${path} as ${key}: body instituteId put the new ${label} into org 2`);
    } else {
      check(name, seenBy1 || instRefs.some((x) => org1Refs.includes(x)), seenBy1 ? "" : "created, but org 1 cannot find it either");
    }
    if (newId) {
      const tried = [];
      for (const who of [...new Set([key, "admin", k2("admin")])]) {
        const d = await call(who, "DELETE", del(newId));
        tried.push(`${who}:${d.status}`);
        if (ok2xx(d.status)) break;
        if (who === k2("admin")) leftovers.push(`[${family}] ${label} ${newId}: delete failed (${tried.join(", ")})`);
      }
    }
  }
};

if (!org2Refs.length) {
  section("mass-assign");
  setup("org-2 instituteId unknown (login user / auth/me / organizations); mass-assignment checks skipped", null);
} else {
  let n = 0;
  const tag = () => `${stamp}-${++n}`;
  await massAssign({ label: "class", path: "/classes", body: () => ({ name: `Iso MA Class ${tag()}`, subject: "Iso" }) });
  await massAssign({ label: "department", path: "/departments", body: () => ({ name: `Iso MA Dept ${tag()}` }) });
  await massAssign({ label: "lead", key: "counselor", path: "/leads", body: () => ({ firstName: "Iso", lastName: `MA ${tag()}` }) });
  await massAssign({ label: "ticket", path: "/tickets", body: () => ({ subject: `Iso MA Ticket ${tag()}` }) });
  await massAssign({ label: "event", path: "/events", body: () => ({ title: `Iso MA Event ${tag()}`, startsAt: future(40) }) });
  await massAssign({ label: "announcement", path: "/announcements", body: () => ({ title: `Iso MA Ann ${tag()}`, content: "iso", targetRoles: ["all"] }) });
  await massAssign({ label: "invoice", key: "accountant", path: "/invoices", body: () => ({ employeeId: employee1, notes: `Iso MA ${tag()}`, lineItems: [{ description: "Iso", quantity: 1, unitPrice: 1 }] }) });
  await massAssign({ label: "contact", key: "counselor", path: "/contacts", body: () => ({ firstName: "Iso", lastName: `MA ${tag()}`, type: "individual" }) });
  await massAssign({ label: "customer", key: "counselor", path: "/customers", body: () => ({ firstName: "Iso", lastName: `MA ${tag()}`, type: "individual" }) });
  await massAssign({ label: "geofence", path: "/geofences", body: () => ({ name: `Iso MA Fence ${tag()}`, latitude: 2, longitude: 2, radiusMeters: 100 }) });
  await massAssign({ label: "salary structure", key: "hr", path: "/salary-structures", body: () => ({ name: `Iso MA Salary ${tag()}`, baseSalary: 1 }) });
  await massAssign({ label: "crm task", key: "counselor", path: "/crm-tasks", body: () => ({ title: `Iso MA Task ${tag()}` }) });
  await massAssign({ label: "study material", path: "/study-materials", body: () => ({ title: `Iso MA Material ${tag()}`, url: "https://example.com/m.pdf", visibility: "institute" }) });
  await massAssign({ label: "user", path: "/users", body: () => ({ name: `Iso MA User ${tag()}`, email: `iso-${tag()}-ma@demo.paisa.test`, password: PASSWORD, role: "employee" }) });
  await massAssign({ label: "employee", key: "hr", path: "/employees", body: () => ({ name: `Iso MA Emp ${tag()}`, email: `iso-${tag()}-mae@demo.paisa.test`, password: PASSWORD }), del: (x) => `/employees/${x}` });
}

// Scratch org-2 user last (it was the target of the foreign-reference checks).
section("cleanup (org 2)");
if (scratch2) await cleanup(k2("admin"), "DELETE", `/users/${scratch2}`, "scratch org-2 user");

/* ───────────────────────── report ───────────────────────── */

const failed = results.filter((x) => !x.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);

console.log(`\nLEAKS: ${leaks.length ? "" : "none"}`);
for (const line of leaks) console.log(`  - ${line}`);

console.log(`\nSETUP: ${setups.length ? "" : "none"}`);
for (const line of setups) console.log(`  - ${line}`);

console.log(`\nERRORS (5xx): ${errors.length ? "" : "none"}`);
for (const line of errors) console.log(`  - ${line}`);

console.log(`\nREFUSED WITH OTHER 4xx (not 403/404): ${odd.length ? "" : "none"}`);
for (const line of odd) console.log(`  - ${line}`);

console.log(`\nLEFTOVERS: ${leftovers.length ? "" : "none"}`);
for (const line of leftovers) console.log(`  - ${line}`);
