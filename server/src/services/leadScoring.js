// server/src/services/leadScoring.js
//
// Rule-based lead score (0–100) with the reasons behind it, so counselors can
// see why a lead is hot. Recomputed when a lead is created or edited, when an
// activity is logged against it, and daily (recency fades).
//   hot ≥ 70 · warm ≥ 40 · cold below.

import { Lead } from "../models/Lead.js";
import { CRMActivity } from "../models/CRMActivity.js";
import logger from "../config/logger.js";

const DAY_MS = 24 * 60 * 60 * 1000;

export const SOURCE_POINTS = {
  referral: 25,
  walk_in: 20,
  website: 15,
  landing_page: 15,
  phone: 15,
  whatsapp: 10,
  google: 10,
  email: 8,
  social_media: 8,
  facebook: 8,
  instagram: 8,
  linkedin: 8,
};

const STATUS_POINTS = {
  qualified: 15,
  contacted: 5,
  nurturing: 5,
  new: 0,
  unqualified: -30,
};

// Closed leads: the score just records the outcome.
const FINAL_SCORES = { converted: 100, lost: 0, junk: 0 };

const ENGAGEMENT_POINTS_EACH = 5;
const ENGAGEMENT_CAP = 25;

export const temperatureFor = (score) => (score >= 70 ? "hot" : score >= 40 ? "warm" : "cold");

/**
 * @param lead            plain lead fields (source, status, email, phone, interests, lastActivityAt…)
 * @param recentActivities activities logged against it in the last 30 days
 */
export const scoreLead = (lead, { recentActivities = 0, now = new Date() } = {}) => {
  if (FINAL_SCORES[lead.status] !== undefined) {
    const score = FINAL_SCORES[lead.status];
    return { score, temperature: temperatureFor(score), factors: [{ label: `Lead is ${lead.status}`, points: score }] };
  }

  const factors = [];
  const add = (label, points) => points && factors.push({ label, points });

  add(`Source: ${String(lead.source ?? "other").replace(/_/g, " ")}`, SOURCE_POINTS[lead.source] ?? 5);
  add("Has an email address", lead.email ? 10 : 0);
  add("Has a phone number", lead.phone || lead.whatsappNumber ? 10 : 0);

  const interests = [...(lead.interestedIn ?? []), ...(lead.interestedPrograms ?? []), ...(lead.interestedClasses ?? [])];
  add("Told us what they want", interests.length || lead.requirement ? 5 : 0);

  add(
    `${recentActivities} interaction${recentActivities === 1 ? "" : "s"} in 30 days`,
    Math.min(ENGAGEMENT_CAP, recentActivities * ENGAGEMENT_POINTS_EACH)
  );

  const last = lead.lastActivityAt ?? lead.lastContactedAt ?? lead.createdAt;
  if (last) {
    const days = (now - new Date(last)) / DAY_MS;
    if (days <= 7) add("Active this week", 15);
    else if (days <= 30) add("Active this month", 8);
    else if (days > 60) add("No activity for 2+ months", -10);
  }

  add(`Status: ${lead.status ?? "new"}`, STATUS_POINTS[lead.status] ?? 0);
  add("Marked urgent / high priority", lead.priority === "urgent" ? 10 : lead.priority === "high" ? 5 : 0);

  const score = Math.max(0, Math.min(100, factors.reduce((sum, f) => sum + f.points, 0)));

  return { score, temperature: temperatureFor(score), factors };
};

/** Recompute and store one lead's score. Never throws (scoring is a side effect). */
export const rescoreLead = async (leadId, now = new Date()) => {
  try {
    const lead = await Lead.findById(leadId).lean();
    if (!lead) return null;

    const recentActivities = await CRMActivity.countDocuments({
      leadId: lead._id,
      createdAt: { $gte: new Date(now.getTime() - 30 * DAY_MS) },
      isDeleted: { $ne: true },
    });

    const result = scoreLead(lead, { recentActivities, now });

    await Lead.updateOne(
      { _id: lead._id },
      { $set: { score: result.score, temperature: result.temperature, scoreFactors: result.factors, scoredAt: now } }
    );

    return result;
  } catch (error) {
    logger.warn("Lead not scored", { leadId: String(leadId), error: error.message });
    return null;
  }
};
