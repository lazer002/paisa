// server/src/validators/crmValidator.js
//
// Body schemas for leads, deals, pipelines, contacts, customers and
// CRM activities / tasks / notes (H3). Fields mirror what the controllers
// read; unknown keys pass through (see validators/common.js). Checks the
// controllers already answer with their own 400 (lead name-or-company,
// note text, "note" type on /crm-activities) are left to the controllers.

import { LEAD_STATUSES } from "../models/Lead.js";
import { DEAL_STAGES, DEAL_STATUSES } from "../models/Deal.js";
import { PIPELINE_TYPES } from "../models/Pipeline.js";
import {
  CONTACT_TYPES,
  CONTACT_STATUSES,
  CONTACT_SOURCES,
  CONTACT_METHODS,
} from "../models/Contact.js";
import {
  CUSTOMER_TYPES,
  CUSTOMER_STATUSES,
  CUSTOMER_SOURCES,
  CUSTOMER_LIFECYCLE_STAGES,
} from "../models/Customer.js";
import {
  ACTIVITY_TYPES,
  ACTIVITY_STATUSES,
  PRIORITIES,
  OUTCOMES,
  CHANNELS,
} from "../models/CRMActivity.js";
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  TASK_TYPES,
} from "../models/CRMTask.js";

import {
  Joi,
  str,
  optStr,
  text,
  optRef,
  optEmail,
  optDate,
  optNum,
  optInt,
  bool,
  oneOf,
  strList,
} from "./common.js";

const phoneLike = () => Joi.string().trim().max(50).allow("", null);

const tags = () => strList(100, 100);

/* ─── Leads ─────────────────────────────────── */

// source/priority accept client aliases ("manual", "medium"); the
// controller maps unknown values to defaults, so they stay free strings.
export const leadSchema = Joi.object({
  firstName: optStr(100),
  lastName: optStr(100),
  company: optStr(300),
  email: optEmail(),
  phone: phoneLike(),
  source: optStr(50),
  priority: optStr(50),
  status: oneOf(LEAD_STATUSES),
  notes: text(5000),
  estimatedValue: optNum(0),
});

/* ─── Deals ─────────────────────────────────── */

export const createDealSchema = Joi.object({
  title: str(300).required(),
  leadId: optRef(),
  value: optNum(0),
  currency: optStr(10),
  stage: oneOf(DEAL_STAGES),
  expectedCloseDate: optDate(),
});

export const updateDealStageSchema = Joi.object({
  stage: oneOf(DEAL_STAGES),
  status: oneOf(DEAL_STATUSES),
});

/* ─── Pipelines ─────────────────────────────── */

const pipelineStage = Joi.alternatives().try(
  Joi.string().trim().max(200),
  Joi.object({
    name: optStr(200),
    // Unknown stage types fall back to "open" in the controller.
    type: optStr(20),
  }).unknown(true)
);

export const createPipelineSchema = Joi.object({
  name: str(200).required(),
  type: oneOf(PIPELINE_TYPES),
  stages: Joi.array().items(pipelineStage).max(50),
});

export const updatePipelineSchema = Joi.object({
  name: optStr(200),
  type: oneOf(PIPELINE_TYPES),
  status: optStr(20),
  stages: Joi.array().items(pipelineStage).min(1).max(50),
});

/* ─── Contacts ──────────────────────────────── */

export const contactSchema = Joi.object({
  type: oneOf(CONTACT_TYPES),
  status: oneOf(CONTACT_STATUSES),
  source: oneOf(CONTACT_SOURCES),
  firstName: optStr(100),
  lastName: optStr(100),
  fullName: optStr(300),
  displayName: optStr(300),
  companyName: optStr(300),
  designation: optStr(200),
  email: optEmail(),
  phone: phoneLike(),
  alternatePhone: phoneLike(),
  whatsappNumber: phoneLike(),
  preferredContactMethod: oneOf(CONTACT_METHODS),
  description: text(5000),
  internalNotes: text(5000),
  tags: tags(),
  doNotContact: bool(),
});

/* ─── Customers ─────────────────────────────── */

export const customerSchema = Joi.object({
  type: oneOf(CUSTOMER_TYPES),
  status: oneOf(CUSTOMER_STATUSES),
  lifecycleStage: oneOf(CUSTOMER_LIFECYCLE_STAGES),
  source: oneOf(CUSTOMER_SOURCES),
  firstName: optStr(200),
  lastName: optStr(200),
  displayName: optStr(500),
  customerSegment: optStr(100),
  customerTier: optStr(100),
  industry: optStr(200),
  notes: text(5000),
  internalNotes: text(5000),
  tags: tags(),
  doNotContact: bool(),
  email: optEmail(),
  phone: phoneLike(),
});

/* ─── Activities / tasks / notes ────────────── */

const parentRefs = {
  leadId: optRef(),
  dealId: optRef(),
  contactId: optRef(),
  customerId: optRef(),
};

const activityFields = {
  ...parentRefs,
  // "note" is accepted here so the controller can answer with its own
  // "Use /crm-notes for notes" message.
  type: oneOf(ACTIVITY_TYPES),
  status: oneOf(ACTIVITY_STATUSES),
  priority: oneOf(PRIORITIES),
  subject: str(500),
  description: text(10000),
  outcome: oneOf(OUTCOMES).allow(null, ""),
  outcomeNotes: text(5000),
  channel: oneOf(CHANNELS),
  scheduledAt: optDate(),
  completedAt: optDate(),
  dueAt: optDate(),
  durationMinutes: optInt(0),
  tags: tags(),
};

export const createActivitySchema = Joi.object({
  ...activityFields,
  type: activityFields.type.required(),
  subject: activityFields.subject.required(),
});

export const updateActivitySchema = Joi.object(activityFields);

export const noteSchema = Joi.object({
  ...parentRefs,
  body: text(10000),
  title: optStr(500),
});

const taskFields = {
  ...parentRefs,
  title: str(500),
  description: text(10000),
  type: oneOf(TASK_TYPES),
  status: oneOf(TASK_STATUSES),
  priority: oneOf(TASK_PRIORITIES),
  startAt: optDate(),
  dueAt: optDate(),
  estimatedMinutes: optInt(0),
  tags: tags(),
  assignee: optRef(),
};

export const createTaskSchema = Joi.object({
  ...taskFields,
  title: taskFields.title.required(),
});

export const updateTaskSchema = Joi.object(taskFields);

export const completeTaskSchema = Joi.object({
  completed: bool(),
  notes: text(5000),
  outcome: optStr(200),
});
