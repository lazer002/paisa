// server/src/services/emailTemplates.js
//
// Small transactional email templates. Every template returns
// { subject, html, text }. All user-supplied values are HTML-escaped;
// links are only ever built from FRONTEND_APP_URL by the callers.

import env from "../config/env.js";

const APP_NAME = "PAISA";

export const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** Base URL of the web app, without a trailing slash. */
export const appUrl = (path = "") => {
  const base = String(
    env.FRONTEND_APP_URL ||
      env.FRONTEND_URL ||
      "http://localhost:5173"
  ).replace(/\/+$/, "");

  return `${base}${path}`;
};

const formatMoney = (amount, currency = "INR") => {
  const value = Number(amount) || 0;

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
    }).format(value);
  } catch {
    return `${currency || ""} ${value.toFixed(2)}`.trim();
  }
};

const formatDate = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: env.DEFAULT_TIMEZONE || "Asia/Kolkata",
  });
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Wrap body HTML in the shared layout.
 * `bodyHtml` must already be escaped by the caller.
 */
const layout = ({ heading, bodyHtml, action }) => {
  const button = action
    ? `<p style="margin:28px 0;">
        <a href="${escapeHtml(action.url)}"
           style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;">
          ${escapeHtml(action.label)}
        </a>
      </p>
      <p style="font-size:12px;color:#6b7280;">If the button does not work, copy this link into your browser:<br>
        <span style="word-break:break-all;">${escapeHtml(action.url)}</span>
      </p>`
    : "";

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;padding:32px;">
          <tr><td>
            <p style="margin:0 0 24px;font-size:20px;font-weight:700;">${APP_NAME}</p>
            <h1 style="margin:0 0 16px;font-size:20px;">${escapeHtml(heading)}</h1>
            <div style="font-size:15px;line-height:1.6;">${bodyHtml}</div>
            ${button}
            <p style="margin-top:32px;font-size:12px;color:#9ca3af;">This is an automated message from ${APP_NAME}. Please do not reply.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
};

const p = (value) =>
  `<p style="margin:0 0 12px;">${value}</p>`;

const greeting = (name) =>
  `Hi ${name ? String(name).trim() : "there"},`;

/* ── Password reset ─────────────────────────── */

export const passwordResetEmail = ({
  name,
  resetUrl,
  expiresInMinutes,
}) => {
  const subject = `Reset your ${APP_NAME} password`;

  const text = [
    greeting(name),
    "",
    `We received a request to reset your ${APP_NAME} password.`,
    `Open this link to choose a new password (valid for ${expiresInMinutes} minutes, single use):`,
    resetUrl,
    "",
    "If you did not ask for this, you can ignore this email. Your password stays the same.",
  ].join("\n");

  const html = layout({
    heading: "Reset your password",
    bodyHtml:
      p(escapeHtml(greeting(name))) +
      p(`We received a request to reset your ${APP_NAME} password.`) +
      p(
        `This link works once and expires in ${escapeHtml(
          expiresInMinutes
        )} minutes.`
      ) +
      p(
        "If you did not ask for this, you can ignore this email. Your password stays the same."
      ),
    action: { label: "Choose a new password", url: resetUrl },
  });

  return { subject, html, text };
};

/* ── Welcome ─────────────────────────────────── */

export const welcomeEmail = ({
  name,
  email,
  role,
  organizationName,
  setPasswordUrl,
  expiresInHours,
}) => {
  const org = organizationName ? ` at ${organizationName}` : "";
  const subject = `Welcome to ${APP_NAME}${org}`;
  const loginUrl = appUrl("/login");
  const roleLabel = String(role || "").replace(/_/g, " ");

  const text = [
    greeting(name),
    "",
    `An account has been created for you on ${APP_NAME}${org}.`,
    `Email: ${email}`,
    roleLabel ? `Role: ${roleLabel}` : null,
    "",
    setPasswordUrl
      ? `Set your password here (valid for ${expiresInHours} hours): ${setPasswordUrl}`
      : null,
    `Sign in: ${loginUrl}`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const html = layout({
    heading: `Welcome to ${APP_NAME}`,
    bodyHtml:
      p(escapeHtml(greeting(name))) +
      p(
        `An account has been created for you on ${APP_NAME}${escapeHtml(org)}.`
      ) +
      p(
        `<strong>Email:</strong> ${escapeHtml(email)}` +
          (roleLabel
            ? `<br><strong>Role:</strong> ${escapeHtml(roleLabel)}`
            : "")
      ) +
      (setPasswordUrl
        ? p(
            `Use the button below to set your password (valid for ${escapeHtml(
              expiresInHours
            )} hours), then sign in at <a href="${escapeHtml(
              loginUrl
            )}">${escapeHtml(loginUrl)}</a>.`
          )
        : p(
            `Sign in at <a href="${escapeHtml(loginUrl)}">${escapeHtml(
              loginUrl
            )}</a> with the password your administrator gave you.`
          )),
    action: setPasswordUrl
      ? { label: "Set your password", url: setPasswordUrl }
      : { label: "Sign in", url: loginUrl },
  });

  return { subject, html, text };
};

/* ── Invoice issued ──────────────────────────── */

export const invoiceIssuedEmail = ({
  name,
  invoiceNumber,
  amount,
  currency,
  dueDate,
  billedName,
}) => {
  const subject = `Invoice ${invoiceNumber || ""} issued`.replace(/\s+/g, " ").trim();
  const url = appUrl("/dashboard/invoices");
  const total = formatMoney(amount, currency);
  const due = formatDate(dueDate);
  const forLine =
    billedName && billedName !== name ? ` for ${billedName}` : "";

  const text = [
    greeting(name),
    "",
    `Invoice ${invoiceNumber || ""}${forLine} has been issued.`,
    `Amount due: ${total}`,
    due ? `Due date: ${due}` : null,
    "",
    `View and pay: ${url}`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const html = layout({
    heading: "A new invoice has been issued",
    bodyHtml:
      p(escapeHtml(greeting(name))) +
      p(
        `Invoice <strong>${escapeHtml(invoiceNumber || "")}</strong>${escapeHtml(
          forLine
        )} has been issued.`
      ) +
      p(
        `<strong>Amount due:</strong> ${escapeHtml(total)}` +
          (due ? `<br><strong>Due date:</strong> ${escapeHtml(due)}` : "")
      ),
    action: { label: "View invoice", url },
  });

  return { subject, html, text };
};

/* ── Leave decision ──────────────────────────── */

export const leaveDecisionEmail = ({
  name,
  status,
  leaveType,
  startDate,
  endDate,
  days,
  reason,
}) => {
  const approved = status === "approved";
  const decision = approved ? "approved" : "rejected";
  const subject = `Your leave request was ${decision}`;
  const url = appUrl("/dashboard/leaves");
  const type = String(leaveType || "leave").replace(/_/g, " ");
  const range = `${formatDate(startDate)} – ${formatDate(endDate)}`;

  const text = [
    greeting(name),
    "",
    `Your ${type} request (${range}${days ? `, ${days} day(s)` : ""}) was ${decision}.`,
    reason ? `${approved ? "Comment" : "Reason"}: ${reason}` : null,
    "",
    `Details: ${url}`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const html = layout({
    heading: `Leave ${decision}`,
    bodyHtml:
      p(escapeHtml(greeting(name))) +
      p(
        `Your <strong>${escapeHtml(type)}</strong> request (${escapeHtml(
          range
        )}${days ? `, ${escapeHtml(days)} day(s)` : ""}) was <strong>${decision}</strong>.`
      ) +
      (reason
        ? p(
            `<strong>${approved ? "Comment" : "Reason"}:</strong> ${escapeHtml(
              reason
            )}`
          )
        : ""),
    action: { label: "View leaves", url },
  });

  return { subject, html, text };
};

/* ── Payslip ready ───────────────────────────── */

export const payslipReadyEmail = ({
  name,
  month,
  year,
  netSalary,
  currency,
}) => {
  const period = `${MONTHS[(Number(month) || 1) - 1]} ${year}`;
  const subject = `Your payslip for ${period} is ready`;
  const url = appUrl("/dashboard/payroll");
  const net = formatMoney(netSalary, currency);

  const text = [
    greeting(name),
    "",
    `Your salary for ${period} has been paid.`,
    `Net pay: ${net}`,
    "",
    `View your payslip: ${url}`,
  ].join("\n");

  const html = layout({
    heading: "Your payslip is ready",
    bodyHtml:
      p(escapeHtml(greeting(name))) +
      p(`Your salary for <strong>${escapeHtml(period)}</strong> has been paid.`) +
      p(`<strong>Net pay:</strong> ${escapeHtml(net)}`),
    action: { label: "View payslip", url },
  });

  return { subject, html, text };
};

/* ── Notification (broadcast) ────────────────── */

export const notificationEmail = ({
  name,
  title,
  body,
  link,
  actorName,
}) => {
  const subject = String(title || "New notification").slice(0, 200);

  // Only relative in-app links are turned into URLs; anything else is
  // shown as text so a broadcast cannot inject an arbitrary link.
  const url =
    typeof link === "string" && link.startsWith("/") && !link.startsWith("//")
      ? appUrl(link)
      : appUrl("/dashboard");

  const text = [
    greeting(name),
    "",
    title,
    body || null,
    actorName ? `— ${actorName}` : null,
    "",
    `Open ${APP_NAME}: ${url}`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const html = layout({
    heading: title || "New notification",
    bodyHtml:
      p(escapeHtml(greeting(name))) +
      (body
        ? p(escapeHtml(body).replace(/\n/g, "<br>"))
        : "") +
      (actorName
        ? p(`<span style="color:#6b7280;">— ${escapeHtml(actorName)}</span>`)
        : ""),
    action: { label: `Open ${APP_NAME}`, url },
  });

  return { subject, html, text };
};

export default {
  escapeHtml,
  appUrl,
  passwordResetEmail,
  welcomeEmail,
  invoiceIssuedEmail,
  leaveDecisionEmail,
  payslipReadyEmail,
  notificationEmail,
};
