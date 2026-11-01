// server/src/config/plans.js
//
// Subscription plan catalog (F4) plus the pure helpers the billing service and
// the plan-limit checks share. Prices are INR; `null` limits mean unlimited.
// The plan keys must match the Organization model's `plan` enum.

export const BILLING_CYCLES = ["monthly", "yearly"];

export const PLAN_CATALOG = Object.freeze([
  {
    key: "free",
    name: "Free",
    description: "For trying PAISA with a small team or class.",
    prices: { monthly: 0, yearly: 0 },
    limits: { maxUsers: 50, maxStudents: 25, storageGb: 1 },
    features: {
      lms: true,
      attendance: true,
      payroll: false,
      crm: false,
      liveSessions: true,
      prioritySupport: false,
    },
    highlights: ["Up to 50 users", "Up to 25 students", "1 GB storage", "Attendance + LMS"],
  },
  {
    key: "starter",
    name: "Starter",
    description: "For growing schools and small companies.",
    prices: { monthly: 999, yearly: 9990 },
    limits: { maxUsers: 150, maxStudents: 100, storageGb: 10 },
    features: {
      lms: true,
      attendance: true,
      payroll: true,
      crm: false,
      liveSessions: true,
      prioritySupport: false,
    },
    highlights: ["Up to 150 users", "Up to 100 students", "10 GB storage", "Payroll + HR tools"],
  },
  {
    key: "pro",
    name: "Pro",
    description: "Everything most institutes and companies need.",
    prices: { monthly: 2499, yearly: 24990 },
    limits: { maxUsers: 1000, maxStudents: 750, storageGb: 100 },
    features: {
      lms: true,
      attendance: true,
      payroll: true,
      crm: true,
      liveSessions: true,
      prioritySupport: true,
    },
    highlights: ["Up to 1,000 users", "Up to 750 students", "100 GB storage", "CRM + priority support"],
    popular: true,
  },
  {
    key: "enterprise",
    name: "Enterprise",
    description: "Large or multi-campus organizations.",
    prices: { monthly: 9999, yearly: 99990 },
    limits: { maxUsers: null, maxStudents: null, storageGb: 1000 },
    features: {
      lms: true,
      attendance: true,
      payroll: true,
      crm: true,
      liveSessions: true,
      prioritySupport: true,
    },
    highlights: ["Unlimited users", "Unlimited students", "1 TB storage", "Dedicated support"],
  },
]);

export const PLAN_KEYS = PLAN_CATALOG.map((plan) => plan.key);

export const PAID_PLAN_KEYS = PLAN_CATALOG.filter(
  (plan) => plan.prices.monthly > 0
).map((plan) => plan.key);

const LIMIT_LABELS = {
  maxUsers: "active users",
  maxStudents: "students",
  storageGb: "GB of storage",
};

export const getPlan = (key) =>
  PLAN_CATALOG.find((plan) => plan.key === key) ?? PLAN_CATALOG[0];

export const isKnownPlan = (key) => PLAN_KEYS.includes(key);

export const planRank = (key) => PLAN_KEYS.indexOf(key);

export const priceFor = (planKey, cycle) => {
  const plan = getPlan(planKey);
  return Number(plan.prices[cycle] ?? plan.prices.monthly ?? 0);
};

/** Plan limits, with any per-organization overrides (super_admin) applied. */
export const effectiveLimits = (planKey, customLimits = null) => {
  const limits = { ...getPlan(planKey).limits };

  for (const key of Object.keys(LIMIT_LABELS)) {
    const value = customLimits?.[key];
    if (value !== undefined && value !== null && value !== "") {
      limits[key] = Number(value);
    }
  }

  return limits;
};

/**
 * Usage figures that exceed the given limits. Empty array = fits.
 * usage: { users, students, storageGb }
 */
export const findLimitViolations = (usage, limits) => {
  const pairs = [
    ["maxUsers", usage.users],
    ["maxStudents", usage.students],
    ["storageGb", usage.storageGb],
  ];

  return pairs
    .filter(([key, used]) => limits[key] !== null && limits[key] !== undefined && Number(used) > Number(limits[key]))
    .map(([key, used]) => ({
      limit: key,
      used: Number(used),
      allowed: Number(limits[key]),
      message: `${Number(used)} ${LIMIT_LABELS[key]} in use, the plan allows ${Number(limits[key])}`,
    }));
};

export const describeViolations = (violations) =>
  violations.map((v) => v.message).join("; ");

/** Adds one billing cycle to a date (calendar months/years). */
export const addCycle = (from, cycle) => {
  const date = new Date(from);

  if (cycle === "yearly") {
    date.setFullYear(date.getFullYear() + 1);
  } else {
    date.setMonth(date.getMonth() + 1);
  }

  return date;
};

/**
 * Period bought by a payment. Paying again for the same plan while the
 * current period is still running extends it from its end; anything else
 * (new plan, lapsed period) starts a fresh period now.
 */
export const nextPeriod = ({
  now = new Date(),
  currentPlan,
  currentPeriodEnd,
  newPlan,
  cycle,
}) => {
  const running =
    currentPlan === newPlan &&
    currentPeriodEnd &&
    new Date(currentPeriodEnd) > now;

  const start = running ? new Date(currentPeriodEnd) : new Date(now);

  return { start, end: addCycle(start, cycle) };
};

/** Days a past_due subscription keeps its plan before it expires. */
export const GRACE_DAYS = 7;

/**
 * Status a subscription should have at `now` (lazy reconciliation, no cron):
 * a paid period that ended moves to past_due (or expired when the owner had
 * cancelled at period end); past_due beyond the grace window expires.
 */
export const reconcileStatus = (
  { plan, status, currentPeriodEnd, cancelAtPeriodEnd },
  now = new Date()
) => {
  if (plan === "free" || !currentPeriodEnd) return status;
  if (!["active", "trialing", "past_due"].includes(status)) return status;

  const end = new Date(currentPeriodEnd);
  if (end > now) return status;

  if (cancelAtPeriodEnd) return "expired";

  const graceEnd = new Date(end.getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000);
  return graceEnd > now ? "past_due" : "expired";
};
