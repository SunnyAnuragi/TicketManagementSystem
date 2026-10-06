import { Router } from "express";
import {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  updateTicketStatus,
  assignTicket,
  getTicketHistory,
} from "../controllers/ticket.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/authorize.middleware.js";
import upload from "../middleware/upload.middleware.js";
import {
  uploadAttachments,
  getTicketAttachments,
  deleteAttachment,
} from "../controllers/attachment.controller.js";

const router = Router();

router.post("/", authenticate, createTicket);
router.get("/", authenticate, getTickets);
router.get("/:id/history", authenticate, getTicketHistory);
router.get("/:id", authenticate, getTicketById);
router.put("/:id", authenticate, updateTicket);
router.delete("/:id", authenticate, deleteTicket);

router.post(
  "/:id/attachments",
  authenticate,
  upload.array("images", 5),
  uploadAttachments,
);

router.patch(
  "/:id/status",
  authenticate,
  authorize("AGENT", "ADMIN"),
  updateTicketStatus,
);

router.delete("/:id/attachments/:attachmentId", authenticate, deleteAttachment);
router.get("/:id/attachments", authenticate, getTicketAttachments);
router.patch("/:id/assign", authenticate, authorize("ADMIN"), assignTicket);

export default router;
