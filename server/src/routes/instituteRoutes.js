import express from "express";
import { 
  createInstitute, 
  getInstitutes, 
  getInstituteById, 
  updateInstitute, 
  deleteInstitute 
} from "../controllers/instituteController.js";

import { 
  authMiddleware, 
  isSuperAdmin, 
  isAdmin, 
  allowRoles 
} from "../middleware/auth.js";

const router = express.Router();

// ✅ Create new institute → Only super_admin or admin
router.post("/", authMiddleware, allowRoles("super_admin", "admin"), createInstitute);

// ✅ Get all institutes → super_admin sees all; admin sees only their own?
router.get("/", authMiddleware, allowRoles("super_admin", "admin"), getInstitutes);

// ✅ Get institute by ID → super_admin sees all; admin sees only their own institute
router.get("/:id", authMiddleware, getInstituteById);

// ✅ Update institute → Only super_admin or admin (owner)
router.put("/:id", authMiddleware, allowRoles("super_admin", "admin"), updateInstitute);

// ✅ Delete institute → Only super_admin
router.delete("/:id", authMiddleware, isSuperAdmin, deleteInstitute);

export default router;
