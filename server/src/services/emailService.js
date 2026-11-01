// server/src/services/emailService.js
//
// Transactional email through the Resend REST API (no SDK dependency).
//
// - RESEND_API_KEY + EMAIL_FROM set (and EMAIL_ENABLED not explicitly
//   "false") → POST https://api.resend.com/emails.
// - Otherwise the email is written to the logger (to / subject / text) so
//   development flows such as password reset still work end to end.
//
// sendEmail never throws: failures are logged and reported in the resolved
// value, so callers on the request path can fire and forget.

import env from "../config/env.js";
import logger from "../config/logger.js";

const RESEND_ENDPOINT =
  "https://api.resend.com/emails";

const REQUEST_TIMEOUT_MS = 10000;

const DEFAULT_FROM =
  "PAISA <onboarding@resend.dev>";

/**
 * Email is delivered through Resend only when a key is configured and
 * EMAIL_ENABLED is not explicitly switched off.
 */
const isDeliveryConfigured = () => {
  if (!env.RESEND_API_KEY) {
    return false;
  }

  const explicit =
    process.env.EMAIL_ENABLED;

  if (
    explicit !== undefined &&
    explicit !== "" &&
    !env.EMAIL_ENABLED
  ) {
    return false;
  }

  return true;
};

const normalizeRecipients = (to) =>
  (Array.isArray(to) ? to : [to])
    .map((value) =>
      String(value || "")
        .trim()
        .toLowerCase()
    )
    .filter((value) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    );

/**
 * Send one transactional email.
 *
 * @param {{ to: string|string[], subject: string, html?: string,
 *           text?: string, tags?: Record<string,string> }} message
 * @returns {Promise<{ delivered: boolean, logged?: boolean,
 *           id?: string, error?: string }>}
 */
export const sendEmail = async ({
  to,
  subject,
  html,
  text,
  tags,
} = {}) => {
  try {
    const recipients =
      normalizeRecipients(to);

    if (
      recipients.length === 0 ||
      !subject
    ) {
      logger.warn(
        "Email skipped: missing recipient or subject",
        { subject: subject || null }
      );

      return {
        delivered: false,
        error: "invalid_message",
      };
    }

    if (!isDeliveryConfigured()) {
      logger.info(
        "Email (not sent: RESEND_API_KEY unset or EMAIL_ENABLED=false)",
        {
          email: {
            to: recipients,
            subject,
            text: text || null,
          },
        }
      );

      return {
        delivered: false,
        logged: true,
      };
    }

    const controller =
      new AbortController();

    const timer = setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS
    );

    let response;

    try {
      response = await fetch(
        RESEND_ENDPOINT,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            from:
              env.EMAIL_FROM ||
              DEFAULT_FROM,
            to: recipients,
            subject,
            ...(html && { html }),
            ...(text && { text }),
            ...(tags && {
              tags: Object.entries(
                tags
              ).map(([name, value]) => ({
                name,
                value: String(value),
              })),
            }),
          }),
          signal: controller.signal,
        }
      );
    } finally {
      clearTimeout(timer);
    }

    const payload = await response
      .json()
      .catch(() => null);

    if (!response.ok) {
      logger.error(
        "Email delivery failed",
        {
          status: response.status,
          to: recipients,
          subject,
          providerError:
            payload?.message ||
            payload?.name ||
            null,
        }
      );

      return {
        delivered: false,
        error:
          payload?.message ||
          `HTTP ${response.status}`,
      };
    }

    logger.info("Email sent", {
      to: recipients,
      subject,
      id: payload?.id || null,
    });

    return {
      delivered: true,
      id: payload?.id || null,
    };
  } catch (error) {
    logger.error(
      "Email delivery error",
      {
        subject: subject || null,
        error: error?.message,
      }
    );

    return {
      delivered: false,
      error: error?.message,
    };
  }
};

/**
 * Fire-and-forget wrapper for request handlers: runs `task` after the
 * current tick and swallows (logs) every error so the response is never
 * affected.
 */
export const sendInBackground = (
  label,
  task
) => {
  setImmediate(() => {
    Promise.resolve()
      .then(task)
      .catch((error) => {
        logger.error(
          `Background email failed: ${label}`,
          { error: error?.message }
        );
      });
  });
};

export const emailDeliveryConfigured =
  isDeliveryConfigured;

export default {
  sendEmail,
  sendInBackground,
  emailDeliveryConfigured,
};
