// Needs the API running and the demo data seeded (npm run seed). API_URL overrides the default.
// End-to-end flow checks against the running API (demo accounts only).
const BASE = process.env.API_URL ?? "http://127.0.0.1:5000/api";
const PASSWORD = "Paisa@Demo1";
const results = [];

const check = (name, ok, detail = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  -> " + detail}`);
};

const sessions = {};
const login = async (role) => {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: `${role}@demo.paisa.test`, password: PASSWORD }),
  });
  const body = await res.json();
  if (!body?.data?.accessToken) throw new Error(`login ${role}: ${res.status} ${body?.message}`);
  sessions[role] = body.data.accessToken;
};

const call = async (role, method, path, body) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { authorization: `Bearer ${sessions[role]}`, "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, data: json?.data, message: json?.message ?? "", meta: json?.meta };
};

for (const role of ["admin", "hr", "teacher", "student", "parent", "employee", "counselor", "accountant"]) {
  await login(role);
}

const stamp = Date.now();
const id = (row) => row?.publicId ?? row?._id;

// ── Lookups ──
const users = (await call("admin", "GET", "/users")).data ?? [];
const userId = (email) => id(users.find((u) => u.email === email));
const studentUser = userId("student@demo.paisa.test");
const employeeUser = userId("employee@demo.paisa.test");

const classes = (await call("teacher", "GET", "/classes")).data ?? [];
const demoClass = classes.find((c) => c.name === "Demo Class 10A");
check("teacher sees the demo class", !!demoClass);

// ── 1. Review creation by user id (was a 500 / not found) ──
let r = await call("hr", "POST", "/reviews", { employeeId: employeeUser, title: `Review ${stamp}`, type: "annual" });
check("hr creates a performance review", r.status === 201, `${r.status} ${r.message}`);
r = await call("employee", "GET", "/reviews");
check("employee sees only their own review", r.status === 200 && (r.data ?? []).length >= 1, `${r.status} ${r.message}`);
r = await call("student", "GET", "/reviews");
check("student cannot list reviews", r.status === 403, String(r.status));

// ── 2. Test taking, answer key, attempt limit ──
r = await call("teacher", "POST", "/questions", {
  text: `2 + 2 ${stamp}?`, type: "single_choice", points: 5, status: "published",
  options: [{ text: "3", isCorrect: false }, { text: "4", isCorrect: true }],
  correctAnswer: "4",
});
check("teacher creates a question", r.status === 201, `${r.status} ${r.message}`);
const questionId = id(r.data);

r = await call("teacher", "POST", "/tests", {
  title: `Quiz ${stamp}`, classId: id(demoClass), type: "quiz", durationMinutes: 10,
  totalPoints: 5, passingScore: 40, questionIds: [questionId],
});
check("teacher creates a test", r.status === 201, `${r.status} ${r.message}`);
const testId = id(r.data);

r = await call("student", "GET", `/tests/${testId}`);
check("student cannot open an unpublished test", r.status === 404, String(r.status));

r = await call("teacher", "PUT", `/tests/${testId}`, { status: "published" });
check("teacher publishes the test", r.status === 200, `${r.status} ${r.message}`);

r = await call("student", "GET", `/tests/${testId}`);
const leaked = JSON.stringify(r.data ?? {}).includes("isCorrect") || JSON.stringify(r.data ?? {}).includes("correctAnswer");
check("student gets the test without the answer key", r.status === 200 && !leaked, `${r.status} leaked=${leaked}`);

r = await call("student", "POST", `/attempts/${testId}/start`, {});
check("student starts an attempt", [200, 201].includes(r.status), `${r.status} ${r.message}`);
const attemptId = id(r.data);

r = await call("student", "PUT", `/attempts/${attemptId}/submit`, { answers: [{ questionId, answer: "4" }] });
check("student submits and is auto-graded 100%", r.status === 200 && r.data?.score?.percentage === 100, `${r.status} ${JSON.stringify(r.data?.score)} ${r.message}`);

r = await call("student", "POST", `/attempts/${testId}/start`, {});
check("second attempt is refused (limit 1)", r.status === 400, `${r.status} ${r.message}`);

// ── 3. Test in a class the student is not enrolled in ──
r = await call("admin", "POST", "/classes", { name: `Other Class ${stamp}`, subject: "Art" });
check("admin creates another class", r.status === 201, `${r.status} ${r.message}`);
const otherClass = id(r.data);
r = await call("admin", "POST", "/tests", {
  title: `Other quiz ${stamp}`, classId: otherClass, type: "quiz", durationMinutes: 10,
  totalPoints: 5, passingScore: 40, questionIds: [questionId],
});
const otherTest = id(r.data);
await call("admin", "PUT", `/tests/${otherTest}`, { status: "published" });
r = await call("student", "GET", `/tests/${otherTest}`);
check("student cannot read another class's test", r.status === 404, String(r.status));
r = await call("student", "POST", `/attempts/${otherTest}/start`, {});
check("student cannot start another class's test", r.status === 404, `${r.status} ${r.message}`);
r = await call("parent", "GET", `/tests/${otherTest}`);
check("parent cannot read another class's test", r.status === 404, String(r.status));

// ── 4. Class attendance code ──
r = await call("teacher", "POST", "/qr-sessions", { classId: id(demoClass), minutes: 5 });
check("teacher opens a class code", r.status === 201 && /^[A-Z2-9]{8}$/.test(r.data?.code ?? ""), `${r.status} ${r.message}`);
const code = r.data?.code;
r = await call("student", "POST", "/attendance/qr-scan", { code: "ZZZZZZZZ", timezone: "Asia/Kolkata" });
check("a wrong code is rejected", r.status === 400, `${r.status} ${r.message}`);
r = await call("student", "POST", "/attendance/qr-scan", { code, timezone: "Asia/Kolkata" });
check("student marks attendance with the code", r.status === 200 && /marked present/i.test(r.message), `${r.status} ${r.message}`);
r = await call("student", "POST", "/attendance/qr-scan", { code, timezone: "Asia/Kolkata" });
check("a second scan says already marked", r.status === 200 && /already/i.test(r.message), `${r.status} ${r.message}`);
r = await call("teacher", "GET", "/qr-sessions");
check("teacher sees 1 scan on the session", (r.data ?? []).some((s) => s.scanCount === 1), JSON.stringify((r.data ?? []).map((s) => s.scanCount)));
r = await call("parent", "GET", "/attendance/me");
const parentRows = r.data?.records ?? [];
check("parent sees the child's attendance with a name", r.status === 200 && parentRows.length >= 1 && !!parentRows[0].userId?.name, `${r.status} rows=${parentRows.length}`);

// ── 5. Geofenced check-in ──
r = await call("admin", "POST", "/geofences", { name: `Far away ${stamp}`, latitude: 10, longitude: 10, radiusMeters: 100 });
check("admin adds a check-in area", r.status === 201, `${r.status} ${r.message}`);
const fenceId = id(r.data);
r = await call("hr", "POST", "/attendance/check-in", { action: "in", latitude: 12.97, longitude: 77.59, accuracy: 20, timezone: "Asia/Kolkata" });
check("check-in outside the area is refused", r.status === 403, `${r.status} ${r.message}`);
r = await call("hr", "POST", "/attendance/check-in", { action: "in", latitude: 10.0003, longitude: 10.0003, accuracy: 20, timezone: "Asia/Kolkata" });
check("check-in inside the area works", r.status === 200, `${r.status} ${r.message}`);
r = await call("hr", "POST", "/attendance/check-in", { action: "in", latitude: 10, longitude: 10, accuracy: 20, timezone: "Asia/Kolkata" });
check("checking in twice is refused", r.status === 400, `${r.status} ${r.message}`);
r = await call("hr", "POST", "/attendance/check-in", { action: "out", latitude: 10, longitude: 10, accuracy: 20, timezone: "Asia/Kolkata" });
check("check-out works", r.status === 200, `${r.status} ${r.message}`);
await call("admin", "DELETE", `/geofences/${fenceId}`);
r = await call("employee", "POST", "/attendance/check-in", { action: "in", timezone: "Asia/Kolkata" });
check("with no areas, check-in works anywhere", r.status === 200, `${r.status} ${r.message}`);

// ── 6. Invoices: parent sees the child's, accountant manages ──
r = await call("accountant", "POST", "/invoices", { studentId: studentUser, lineItems: [{ description: "Fees", quantity: 1, unitPrice: 1000 }] });
check("accountant creates an invoice", r.status === 201, `${r.status} ${r.message}`);
const invoiceId = id(r.data);
r = await call("accountant", "PUT", `/invoices/${invoiceId}/status`, { status: "issued" });
check("accountant sends the invoice", r.status === 200, `${r.status} ${r.message}`);
r = await call("parent", "GET", `/invoices/${invoiceId}`);
check("parent can open the child's invoice", r.status === 200, `${r.status} ${r.message}`);
r = await call("employee", "GET", `/invoices/${invoiceId}`);
check("employee cannot open it", r.status === 404 || r.status === 403, String(r.status));

// ── 7. CRM contacts and customers ──
r = await call("counselor", "POST", "/contacts", { firstName: "Asha", lastName: "Rao", email: `asha${stamp}@example.com`, phone: "9876543210", type: "parent" });
check("counselor creates a contact", r.status === 201, `${r.status} ${r.message}`);
const contactId = id(r.data);
r = await call("counselor", "PUT", `/contacts/${contactId}`, { status: "inactive", phone: "" });
check("counselor edits a contact and clears the phone", r.status === 200, `${r.status} ${r.message}`);
r = await call("counselor", "POST", "/customers", { firstName: "Ravi", lastName: "K", email: `ravi${stamp}@example.com`, type: "individual" });
check("counselor creates a customer", r.status === 201, `${r.status} ${r.message}`);
r = await call("student", "GET", "/contacts");
check("student cannot read contacts", r.status === 403, String(r.status));

// ── 8. Employee documents ──
r = await call("hr", "POST", "/employee-documents", { employeeUserId: employeeUser, title: "Bad link", type: "identity", fileUrl: "javascript:alert(1)" });
check("a javascript: file link is rejected", r.status === 400, `${r.status} ${r.message}`);
r = await call("hr", "POST", "/employee-documents", { employeeUserId: employeeUser, title: `Contract ${stamp}`, type: "contract", fileUrl: "https://example.com/contract.pdf" });
check("hr records a document", r.status === 201, `${r.status} ${r.message}`);
r = await call("employee", "GET", "/employee-documents");
check("employee sees their own documents", r.status === 200 && (r.data ?? []).length >= 1, `${r.status} ${r.message}`);
r = await call("student", "GET", "/employee-documents");
check("student cannot read employee documents", r.status === 403, String(r.status));

// ── 9. Audit log ──
r = await call("admin", "GET", "/audit-logs?limit=5");
check("admin reads the audit log", r.status === 200 && (r.data ?? []).length > 0, `${r.status} ${r.message}`);
r = await call("teacher", "GET", "/audit-logs");
check("teacher cannot read the audit log", r.status === 403, String(r.status));

const failed = results.filter((x) => !x.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
