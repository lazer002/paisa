// server/src/routes/ticketRoutes.js

import express from "express";

import {
  createTicket,
  getTickets,
  getTicket,
  updateTicket,
  deleteTicket,
  addTicketMessage,
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

router.get(
  "/:publicId",
  authorize({ anyPermissions: ["ticket:read"] }),
  getTicket
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
