import express from "express";
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";

import { authMiddleware, allowRoles } from "../middleware/auth.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", allowRoles("super_admin", "admin"), createUser);
router.get("/", allowRoles("super_admin", "admin"), getUsers);
router.get("/:id", allowRoles("super_admin", "admin"), getUserById);
router.put("/:id", allowRoles("super_admin", "admin"), updateUser);
router.delete("/:id", allowRoles("super_admin"), deleteUser);

export default router;