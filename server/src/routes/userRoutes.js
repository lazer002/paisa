import express from "express";
import { 
  createUser, 
  getUsers, 
  getUserById, 
  updateUser, 
  deleteUser 
} from "../controllers/userController.js";
import { 
  authMiddleware, 
  isSuperAdmin, 
  isAdmin, 
  isTeacher, 
  isStudent, 
  isHR, 
  isEmployee, 
  allowRoles 
} from "../middleware/auth.js";

const router = express.Router();

// ✅ Create new user → Only super_admin or admin
router.post("/", authMiddleware, allowRoles("super_admin", "admin"), createUser);

// ✅ Get all users → Only super_admin or admin
router.get("/", authMiddleware, allowRoles("super_admin", "admin"), getUsers);

// ✅ Get user by ID → Super_admin/admin can get anyone; others only their own
router.get("/:id", authMiddleware, getUserById);

// ✅ Update user → Only super_admin or admin
router.put("/:id", authMiddleware, allowRoles("super_admin", "admin"), updateUser);

// ✅ Delete user → Only super_admin
router.delete("/:id", authMiddleware, isSuperAdmin, deleteUser);

export default router;
