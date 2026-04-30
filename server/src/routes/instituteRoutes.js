import express from "express";
import {
  createInstitute,
  getInstitutes,
  getInstituteById,
  updateInstitute,
  deleteInstitute,
} from "../controllers/instituteController.js";

import {
  adminAccess,
  manageInstitutes,
  superAdminOnly,
} from "../middleware/policies.js";

const router = express.Router();

//
// 🔹 GET ALL
//
router.get("/", adminAccess, getInstitutes);

//
// 🔹 GET ONE
//
router.get("/:id", adminAccess, getInstituteById);

//
// 🔹 CREATE
//
router.post("/", manageInstitutes, createInstitute);

//
// 🔹 UPDATE
//
router.put("/:id", manageInstitutes, updateInstitute);

//
// 🔹 DELETE
//
router.delete("/:id", superAdminOnly, deleteInstitute);

export default router;