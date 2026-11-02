// server/src/services/notify.js
//
// In-app notifications created by the system (scheduled jobs, reminders).
// `reference.kind` + `reference.id` make a notification unique per user, so
// a job that runs again never sends the same reminder twice.

import { NotificationLog } from "../models/NotificationLog.js";
import { emit } from "../realtime/emitter.js";
import logger from "../config/logger.js";

/**
 * Notify each user once for (kind, id). Returns how many were created.
 * Never throws: a failed reminder must not stop the job that sent it.
 */
export const notifyOnce = async ({
  instituteId,
  userIds,
  type,
  title,
  body = null,
  link = null,
  reference,
}) => {
  try {
    const ids = [...new Set((userIds ?? []).map(String))];
    if (!instituteId || ids.length === 0) return 0;

    const already = new Set(
      (
        await NotificationLog.find({
          userId: { $in: ids },
          "reference.kind": reference.kind,
          "reference.id": reference.id,
        })
          .select("userId")
          .lean()
      ).map((n) => String(n.userId))
    );

    const fresh = ids.filter((id) => !already.has(id));
    if (fresh.length === 0) return 0;

    const created = await NotificationLog.insertMany(
      fresh.map((userId) => ({
        instituteId,
        userId,
        type,
        title,
        body,
        link,
        actorName: "PAISA",
        channels: ["in_app"],
        status: "unread",
        reference,
      }))
    );

    for (const notification of created) {
      emit.toUser(notification.userId, "notification:new", {
        notification: notification.toJSON(),
      });
    }

    return created.length;
  } catch (error) {
    logger.warn("System notification not sent", {
      kind: reference?.kind,
      error: error.message,
    });

    return 0;
  }
};
