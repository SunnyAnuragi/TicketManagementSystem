import { Router } from "express";
import { createComment , getComments } from "../controllers/comment.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/:ticketId/comments", authenticate, createComment);
router.get("/:ticketId/comments", authenticate, getComments);

export default router;
