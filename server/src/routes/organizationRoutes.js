import express from "express";
import {
  createOrganization,
  deleteOrganization,
  getOrganization,
  getOrganizations,
  updateOrganization,
} from "../controllers/organizationController.js";

import { adminAccess, superAdminOnly } from "../middleware/policies.js";

const router = express.Router();

//
// 🔹 GET ALL
//
router.get("/", adminAccess, getOrganizations);

//
// 🔹 GET ONE (ID or slug)
//
router.get("/:id", adminAccess, getOrganization);

//
// 🔹 CREATE — platform-level action, super admin only
//
router.post("/", superAdminOnly, createOrganization);

//
// 🔹 UPDATE — admin can update THEIR org (scoped in controller),
//    field-level restrictions also enforced in controller
//
router.put("/:id", adminAccess, updateOrganization);

//
// 🔹 DELETE — destroying an organization is super admin only
//
router.delete("/:id", superAdminOnly, deleteOrganization);

export default router;