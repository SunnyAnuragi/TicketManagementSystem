import { Router } from "express";
import {
  createAgent,
  getAgents,
  getAgentById,
  updateAgent,
} from "./agent.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/authorize.middleware.js";

const router = Router();

router.post("/", authenticate, authorize("ADMIN"), createAgent);
router.get("/", authenticate, authorize("ADMIN"), getAgents);
router.get("/:id", authenticate, authorize("ADMIN"), getAgentById);
router.patch("/:id", authenticate, authorize("ADMIN"), updateAgent);

export default router;
