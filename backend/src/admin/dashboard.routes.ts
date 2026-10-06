import { Router } from "express";
import { getDashboardStats } from "./dashboard.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/authorize.middleware.js";

const router = Router();

router.get("/stats", authenticate, authorize("ADMIN"), getDashboardStats);

export default router;
