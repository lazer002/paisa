// server/src/routes/ticketRoutes.js

import express from "express";

import {
  createTicket,
  getTickets,
  getTicket,
  getTicketAssignees,
  updateTicket,
  deleteTicket,
  addTicketMessage,
  getTicketTemplates,
  createTicketTemplate,
  updateTicketTemplate,
  deleteTicketTemplate,
} from "../controllers/ticketController.js";

import authenticate from "../middleware/authenticate.js";

import { authorize } from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize({ anyPermissions: ["ticket:read"] }),
  getTickets
);

// Reply templates (canned responses). Declared before "/:publicId";
// the controller limits reads to staff and writes to admin/support.
router.get(
  "/templates",
  authorize({ anyPermissions: ["ticket:update", "ticket:manage"] }),
  getTicketTemplates
);

router.post(
  "/templates",
  authorize({ anyPermissions: ["ticket:update", "ticket:manage"] }),
  createTicketTemplate
);

router.put(
  "/templates/:templateId",
  authorize({ anyPermissions: ["ticket:update", "ticket:manage"] }),
  updateTicketTemplate
);

router.delete(
  "/templates/:templateId",
  authorize({ anyPermissions: ["ticket:update", "ticket:manage"] }),
  deleteTicketTemplate
);

router.get(
  "/:publicId",
  authorize({ anyPermissions: ["ticket:read"] }),
  getTicket
);

router.get(
  "/:publicId/assignees",
  authorize({ anyPermissions: ["ticket:update"] }),
  getTicketAssignees
);

router.post(
  "/",
  authorize({ anyPermissions: ["ticket:create"] }),
  createTicket
);

router.post(
  "/:publicId/messages",
  authorize({ anyPermissions: ["ticket_message:create", "ticket:update"] }),
  addTicketMessage
);

router.put(
  "/:publicId",
  authorize({ anyPermissions: ["ticket:update"] }),
  updateTicket
);

router.delete(
  "/:publicId",
  authorize({ anyPermissions: ["ticket:delete"] }),
  deleteTicket
);

export default router;
