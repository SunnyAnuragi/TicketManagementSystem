import { Router } from "express";
import {
  createUser,
  getUsers,
  getUserById,
} from "../controllers/user.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/authorize.middleware.js";
const router = Router();

router.post("/", authenticate, authorize("ADMIN"), createUser);
router.get("/", authenticate, authorize("ADMIN"), getUsers);
router.get("/:id", authenticate, authorize("ADMIN"), getUserById);

export default router;
