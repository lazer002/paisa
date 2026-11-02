// server/src/jobs/maintenance.js
//
// Housekeeping: delete uploads that were never attached to anything, drop
// expired refresh sessions, and keep this year's leave balances (with
// carry-over) in place for every member a leave policy covers.

import { File } from "../models/File.js";
import RefreshSession from "../models/RefreshSession.js";
import { User } from "../models/User.js";
import LeavePolicy from "../models/LeavePolicy.js";
import { getStorage } from "../services/storage/index.js";
import { leaveYearOf, syncUserBalances } from "../services/leaveBalanceService.js";
import logger from "../config/logger.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const BATCH = 500;

export const abandonedUploadCleanup = {
  name: "upload-cleanup",
  description: "Deletes uploads never attached to a record within a day (bytes and metadata)",
  everyMinutes: 24 * 60,

  async run(now = new Date()) {
    const files = await File.find({
      "linkedResource.id": null,
      isDeleted: { $ne: true },
      createdAt: { $lt: new Date(now.getTime() - DAY_MS) },
    })
      .select("_id storageProvider storageKey")
      .limit(BATCH);

    let deleted = 0;
    let failed = 0;

    for (const file of files) {
      try {
        await getStorage(file.storageProvider).remove(file.storageKey);
        await File.deleteOne({ _id: file._id });
        deleted += 1;
      } catch (error) {
        failed += 1;
        logger.warn("Abandoned upload not removed", { fileId: String(file._id), error: error.message });
      }
    }

    return { deleted, failed };
  },
};

export const expiredSessionCleanup = {
  name: "session-cleanup",
  description: "Removes refresh sessions that have expired",
  everyMinutes: 24 * 60,

  async run() {
    const result = await RefreshSession.cleanupExpired();
    return { removed: result.deletedCount ?? 0 };
  },
};

export const leaveBalanceSync = {
  name: "leave-balances",
  description: "Creates this year's leave balances (with carry-over) for everyone a leave policy covers",
  everyMinutes: 24 * 60,

  async run(now = new Date()) {
    const year = leaveYearOf(now);
    const instituteIds = await LeavePolicy.find({ isDeleted: { $ne: true } }).distinct("instituteId");

    let users = 0;
    let balances = 0;

    for (const instituteId of instituteIds) {
      const members = await User.find({ instituteId, status: "active", isDeleted: { $ne: true } })
        .select("_id role instituteId")
        .lean();

      for (const member of members) {
        const synced = await syncUserBalances(member, year);
        if (synced.length) {
          users += 1;
          balances += synced.length;
        }
      }
    }

    return { year, organizations: instituteIds.length, users, balances };
  },
};
