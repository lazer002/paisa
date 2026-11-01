// server/src/validators/ticketValidator.js
//
// Body schemas for tickets, ticket replies and reply templates (H3).

import {
  Joi,
  str,
  text,
  optRef,
  bool,
  oneOf,
  optOneOf,
} from "./common.js";

import {
  TICKET_TYPES,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
} from "../models/Ticket.js";

export const createTicketSchema = Joi.object({
  subject: str(500, 3).required(),
  description: text(20000),
  type: optOneOf(TICKET_TYPES),
  priority: optOneOf(TICKET_PRIORITIES),
});

export const updateTicketSchema = Joi.object({
  status: oneOf(TICKET_STATUSES),
  priority: oneOf(TICKET_PRIORITIES),
  assigneeId: optRef(),
});

export const ticketMessageSchema = Joi.object({
  body: str(50000).required(),
  isInternal: bool(),
});

export const createTicketTemplateSchema = Joi.object({
  name: str(120).required(),
  body: str(5000).required(),
});

export const updateTicketTemplateSchema = Joi.object({
  name: str(120),
  body: str(5000),
});
