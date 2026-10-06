import { Request, Response } from "express";
import pool from "../db/connection.js";

export const createComment = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    const user = req.user;

    const ticketId = Number(req.params.ticketId);
    const { message } = req.body;

    // Validate ticket ID
    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      res.status(400).json({
        message: "Invalid ticket ID",
      });
      return;
    }

    // Validate message
    if (!message || typeof message !== "string" || !message.trim()) {
      res.status(400).json({
        message: "message is required",
      });
      return;
    }

    // Check if ticket exists
    const [ticketRows] = await pool.execute(
      `SELECT id, created_by, assigned_to, status
       FROM tickets
       WHERE id = ?`,
      [ticketId],
    );

    const tickets = ticketRows as {
      id: number;
      created_by: number;
      assigned_to: number | null;
      status: string;
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

    // Customer can comment only on their own ticket
    if (user.role === "CUSTOMER" && ticket.created_by !== user.userId) {
      res.status(403).json({
        message: "You can only comment on your own tickets",
      });
      return;
    }

    // Agent can comment only on tickets assigned to them
    if (user.role === "AGENT" && ticket.assigned_to !== user.userId) {
      res.status(403).json({
        message: "You can only comment on tickets assigned to you",
      });
      return;
    }

    // Insert comment
    const [result] = await pool.execute(
      `INSERT INTO ticket_comments
          (ticket_id, user_id, message)
       VALUES (?, ?, ?)`,
      [ticketId, user.userId, message.trim()],
    );

    const insertResult = result as { insertId: number };

    res.status(201).json({
      message: "Comment created successfully",
      commentId: insertResult.insertId,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create comment",
    });
  }
};

export const getComments = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    const user = req.user;

    const ticketId = Number(req.params.ticketId);

    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      res.status(400).json({
        message: "Invalid ticket ID",
      });
      return;
    }

    const [ticketRows] = await pool.execute(
      `SELECT
          id,
          created_by,
          assigned_to
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

    // CUSTOMER can view comments only on their own ticket
    if (user.role === "CUSTOMER" && ticket.created_by !== user.userId) {
      res.status(403).json({
        message: "You can only view comments on your own tickets",
      });
      return;
    }

    // AGENT can view comments only on assigned tickets
    if (user.role === "AGENT" && ticket.assigned_to !== user.userId) {
      res.status(403).json({
        message: "You can only view comments on tickets assigned to you",
      });
      return;
    }

    const [rows] = await pool.execute(
      `SELECT
          ticket_comments.id,
          ticket_comments.message,
          ticket_comments.created_at,
          users.id AS user_id,
          users.name AS user_name,
          users.email AS user_email
       FROM ticket_comments
       JOIN users
          ON ticket_comments.user_id = users.id
       WHERE ticket_comments.ticket_id = ?
       ORDER BY ticket_comments.created_at ASC`,
      [ticketId],
    );

    res.status(200).json({
      ticketId,
      comments: rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch comments",
    });
  }
};
