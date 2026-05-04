import express from "express";
import {
  createOrganization,
  deleteOrganization,
  getOrganization,
  getOrganizations,
  updateOrganization,
} from "../controllers/organizationController.js";

import {
  adminAccess,
  manageOrganizations,
  superAdminOnly,
} from "../middleware/policies.js";

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
// 🔹 CREATE
//
router.post("/", manageOrganizations, createOrganization);

//
// 🔹 UPDATE
//
router.put("/:id", manageOrganizations, updateOrganization);

//
// 🔹 DELETE
//
router.delete("/:id", manageOrganizations, deleteOrganization);
// or use superAdminOnly if platform-controlled

export default router;