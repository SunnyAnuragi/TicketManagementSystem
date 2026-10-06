import { Request, Response } from "express";
import pool from "../db/connection.js";
import cloudinary from "../config/cloudinary.js";
import { UploadApiResponse } from "cloudinary";

export const uploadAttachments = async (req: Request, res: Response) => {
  try {
    // 1. Check authentication
    if (!req.user) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    const user = req.user;

    // 2. Get ticket ID
    const ticketId = Number(req.params.id);

    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      res.status(400).json({
        message: "Invalid ticket ID",
      });
      return;
    }

    // 3. Get ticket
    const [ticketRows] = await pool.execute(
      `SELECT id, status, created_by, assigned_to
             FROM tickets
             WHERE id = ?`,
      [ticketId],
    );

    const tickets = ticketRows as {
      id: number;
      status: string;
      created_by: number;
      assigned_to: number | null;
    }[];

    // 4. Check ticket exists
    if (tickets.length === 0) {
      res.status(404).json({
        message: "Ticket not found",
      });
      return;
    }

    const ticket = tickets[0];

    // 5. Closed tickets cannot be modified
    if (ticket.status === "CLOSED") {
      res.status(400).json({
        message: "Closed tickets cannot be modified",
      });
      return;
    }

    // 6. Customer → own ticket only
    if (user.role === "CUSTOMER" && ticket.created_by !== user.userId) {
      res.status(403).json({
        message: "You can only modify your own tickets",
      });
      return;
    }

    // 7. Agent → assigned tickets only
    if (user.role === "AGENT" && ticket.assigned_to !== user.userId) {
      res.status(403).json({
        message: "You can only modify tickets assigned to you",
      });
      return;
    }

    // 8. Get uploaded files
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({
        message: "At least one image is required",
      });
      return;
    }

    // 9. Check existing attachment count
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS count
             FROM ticket_attachments
             WHERE ticket_id = ?`,
      [ticketId],
    );

    const existingCount = Number((countRows as { count: number }[])[0].count);

    // 10. Enforce maximum 5 images per ticket
    if (existingCount + files.length > 5) {
      res.status(400).json({
        message: `A ticket can have maximum 5 images. Currently it has ${existingCount}.`,
      });
      return;
    }

    const uploadedAttachments = [];

    // 11. Upload each image to Cloudinary
    for (const file of files) {
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "ticket-attachments",
            resource_type: "image",
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else if (result) {
              resolve(result);
            }
          },
        );

        uploadStream.end(file.buffer);
      });

      // 12. Save metadata in MySQL
      const [insertResult] = await pool.execute(
        `INSERT INTO ticket_attachments
                (
                    ticket_id,
                    uploaded_by,
                    file_name,
                    file_url,
                    public_id,
                    file_type,
                    file_size
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          ticketId,
          user.userId,
          file.originalname,
          result.secure_url,
          result.public_id,
          file.mimetype,
          file.size,
        ],
      );

      uploadedAttachments.push({
        id: (insertResult as { insertId: number }).insertId,
        file_name: file.originalname,
        file_url: result.secure_url,
        public_id: result.public_id,
        file_type: file.mimetype,
        file_size: file.size,
      });
    }

    // 13. Return response
    res.status(201).json({
      message: "Images uploaded successfully",
      ticketId,
      attachments: uploadedAttachments,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to upload images",
    });
  }
};

export const getTicketAttachments = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    const user = req.user;
    const ticketId = Number(req.params.id);

    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      res.status(400).json({
        message: "Invalid ticket ID",
      });
      return;
    }

    // Check ticket exists
    const [ticketRows] = await pool.execute(
      `SELECT id, created_by, assigned_to
             FROM tickets
             WHERE id = ?`,
      [ticketId],
    );

    const tickets = ticketRows as {
      id: number;
      created_by: number;
      assigned_to: number | null;
    }[];

    if (tickets.length === 0) {
      res.status(404).json({
        message: "Ticket not found",
      });
      return;
    }

    const ticket = tickets[0];

    // Authorization
    if (user.role === "CUSTOMER" && ticket.created_by !== user.userId) {
      res.status(403).json({
        message: "You can only view attachments of your own tickets",
      });
      return;
    }

    if (user.role === "AGENT" && ticket.assigned_to !== user.userId) {
      res.status(403).json({
        message: "You can only view attachments of tickets assigned to you",
      });
      return;
    }

    // Get attachments
    const [attachmentRows] = await pool.execute(
      `SELECT
                id,
                ticket_id,
                uploaded_by,
                file_name,
                file_url,
                public_id,
                file_type,
                file_size,
                created_at
             FROM ticket_attachments
             WHERE ticket_id = ?
             ORDER BY created_at ASC`,
      [ticketId],
    );

    res.status(200).json({
      ticketId,
      attachments: attachmentRows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch attachments",
    });
  }
};

export const deleteAttachment = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    const user = req.user;

    const ticketId = Number(req.params.id);
    const attachmentId = Number(req.params.attachmentId);

    if (
      !Number.isInteger(ticketId) ||
      ticketId <= 0 ||
      !Number.isInteger(attachmentId) ||
      attachmentId <= 0
    ) {
      res.status(400).json({
        message: "Invalid ticket ID or attachment ID",
      });
      return;
    }

    // Get ticket
    const [ticketRows] = await pool.execute(
      `SELECT id, status, created_by, assigned_to
             FROM tickets
             WHERE id = ?`,
      [ticketId],
    );

    const tickets = ticketRows as {
      id: number;
      status: string;
      created_by: number;
      assigned_to: number | null;
    }[];

    if (tickets.length === 0) {
      res.status(404).json({
        message: "Ticket not found",
      });
      return;
    }

    const ticket = tickets[0];

    // Closed tickets cannot be modified
    if (ticket.status === "CLOSED") {
      res.status(400).json({
        message: "Closed tickets cannot be modified",
      });
      return;
    }

    // Authorization
    if (user.role === "CUSTOMER" && ticket.created_by !== user.userId) {
      res.status(403).json({
        message: "You can only modify your own tickets",
      });
      return;
    }

    if (user.role === "AGENT" && ticket.assigned_to !== user.userId) {
      res.status(403).json({
        message: "You can only modify tickets assigned to you",
      });
      return;
    }

    // Get attachment
    const [attachmentRows] = await pool.execute(
      `SELECT
                id,
                ticket_id,
                public_id
             FROM ticket_attachments
             WHERE id = ? AND ticket_id = ?`,
      [attachmentId, ticketId],
    );

    const attachments = attachmentRows as {
      id: number;
      ticket_id: number;
      public_id: string;
    }[];

    if (attachments.length === 0) {
      res.status(404).json({
        message: "Attachment not found",
      });
      return;
    }

    const attachment = attachments[0];

    // Delete image from Cloudinary
    await cloudinary.uploader.destroy(attachment.public_id, {
      resource_type: "image",
    });

    // Delete metadata from MySQL
    await pool.execute(
      `DELETE FROM ticket_attachments
             WHERE id = ? AND ticket_id = ?`,
      [attachmentId, ticketId],
    );

    res.status(200).json({
      message: "Attachment deleted successfully",
      attachmentId,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to delete attachment",
    });
  }
};
