import { Request, Response } from "express";
import pool from "../db/connection.js";

export const createTicket = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    const user = req.user;
    const { title, description, priority } = req.body;

    if (!title || !description || !priority) {
      res.status(400).json({
        message: "title, description and priority are required",
      });
      return;
    }

    const validPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

    if (!validPriorities.includes(priority)) {
      res.status(400).json({
        message: "Invalid priority",
      });
      return;
    }

    const [result] = await pool.execute(
      `INSERT INTO tickets
            (title, description, priority, created_by)
            VALUES (?, ?, ?, ?)`,
      [title, description, priority, user.userId],
    );

    res.status(201).json({
      message: "Ticket created successfully",
      ticketId: (result as { insertId: number }).insertId,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create ticket",
    });
  }
};

export const getTickets = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    if (!Number.isInteger(limit) || limit <= 0 || limit > 100) {
      res.status(400).json({
        message: "limit must be between 1 and 100",
      });
      return;
    }
    const search = String(req.query.search || "").trim();
    const status = String(req.query.status || "").trim();
    const priority = String(req.query.priority || "").trim();

    if (!Number.isInteger(page) || page <= 0) {
      res.status(400).json({
        message: "page must be a positive integer",
      });
      return;
    }

    const conditions: string[] = [];
    const queryParams: (string | number)[] = [];

    if (user.role === "CUSTOMER") {
      conditions.push("tickets.created_by = ?");
      queryParams.push(user.userId);
    }

    if (user.role === "AGENT") {
      conditions.push("tickets.assigned_to = ?");
      queryParams.push(user.userId);
    }

    if (search) {
      conditions.push(`
        (tickets.title LIKE ? OR tickets.description LIKE ?)
    `);

      const searchPattern = `%${search}%`;

      queryParams.push(searchPattern, searchPattern);
    }

    const validStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
    const validPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

    if (priority) {
      if (!validPriorities.includes(priority)) {
        res.status(400).json({
          message: "Invalid priority",
        });
        return;
      }

      conditions.push("tickets.priority = ?");
      queryParams.push(priority);
    }

    if (status) {
      if (!validStatuses.includes(status)) {
        res.status(400).json({
          message: "Invalid status",
        });
        return;
      }

      conditions.push("tickets.status = ?");
      queryParams.push(status);
    }

    const offset = (page - 1) * limit;

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total
     FROM tickets
     ${whereClause}`,
      [...queryParams],
    );
    const totalTickets = (countRows as { total: number }[])[0].total;
    const totalPages = Math.ceil(totalTickets / limit);

    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    const [rows] = await pool.execute(
      `SELECT
        tickets.id,
        tickets.title,
        tickets.description,
        tickets.priority,
        tickets.status,
        tickets.created_at,
        tickets.updated_at,
        users.id AS creator_id,
        users.name AS creator_name,
        users.email AS creator_email
     FROM tickets
     JOIN users
        ON tickets.created_by = users.id
        ${whereClause}
     ORDER BY tickets.created_at DESC, tickets.id DESC
     LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset],
    );

    res.status(200).json({
      page,
      limit,
      totalTickets,
      totalPages,
      hasNextPage,
      hasPreviousPage,
      tickets: rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch tickets",
    });
  }
};

export const getTicketById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    const ticketId = Number(req.params.id);

    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      res.status(400).json({
        message: "Invalid ticket ID",
      });
      return;
    }

    const user = req.user;

    const [rows] = await pool.execute(
      `SELECT
                t.id,
                t.title,
                t.description,
                t.priority,
                t.status,
                t.created_by,
                t.assigned_to,
                t.created_at,
                t.updated_at,
                u.name AS creator_name,
                u.email AS creator_email
             FROM tickets t
             JOIN users u ON t.created_by = u.id
             WHERE t.id = ?`,
      [ticketId],
    );

    const tickets = rows as {
      id: number;
      title: string;
      description: string;
      priority: string;
      status: string;
      created_by: number;
      assigned_to: number | null;
      created_at: Date;
      updated_at: Date;
      creator_name: string;
      creator_email: string;
    }[];

    if (tickets.length === 0) {
      res.status(404).json({
        message: "Ticket not found",
      });
      return;
    }

    const ticket = tickets[0];

    // CUSTOMER → only their own tickets
    if (user.role === "CUSTOMER" && ticket.created_by !== user.userId) {
      res.status(403).json({
        message: "You can only view your own tickets",
      });
      return;
    }

    if (user.role === "AGENT" && ticket.assigned_to !== user.userId) {
      res.status(403).json({
        message: "You can only view tickets assigned to you",
      });
      return;
    }

    // ADMIN → can view any ticket

    res.status(200).json({
      ticket,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch ticket",
    });
  }
};

export const updateTicket = async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  let transactionStarted = false;

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

    const { title, description } = req.body;

    if (!title || !description) {
      res.status(400).json({
        message: "title and description are required",
      });
      return;
    }

    const [rows] = await connection.execute(
      `SELECT
                id,
                title,
                description,
                priority,
                status,
                created_by,
                assigned_to
             FROM tickets
             WHERE id = ?`,
      [ticketId],
    );

    const tickets = rows as {
      id: number;
      title: string;
      description: string;
      priority: string;
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

    // CLOSED tickets cannot be modified
    if (ticket.status === "CLOSED") {
      res.status(400).json({
        message: "Closed tickets cannot be modified",
      });
      return;
    }

    // CUSTOMER → only their own tickets
    if (user.role === "CUSTOMER" && ticket.created_by !== user.userId) {
      res.status(403).json({
        message: "You can only modify your own tickets",
      });
      return;
    }

    // AGENT → only tickets assigned to them
    if (user.role === "AGENT" && ticket.assigned_to !== user.userId) {
      res.status(403).json({
        message: "You can only modify tickets assigned to you",
      });
      return;
    }

    await connection.beginTransaction();
    transactionStarted = true;

    await connection.execute(
      `UPDATE tickets
             SET title = ?, description = ?
             WHERE id = ?`,
      [title, description, ticketId],
    );

    if (ticket.title !== title) {
      await connection.execute(
        `INSERT INTO ticket_history
                (ticket_id, user_id, action, old_value, new_value)
             VALUES (?, ?, ?, ?, ?)`,
        [ticketId, user.userId, "TITLE_CHANGED", ticket.title, title],
      );
    }

    if (ticket.description !== description) {
      await connection.execute(
        `INSERT INTO ticket_history
                (ticket_id, user_id, action, old_value, new_value)
             VALUES (?, ?, ?, ?, ?)`,
        [
          ticketId,
          user.userId,
          "DESCRIPTION_CHANGED",
          ticket.description,
          description,
        ],
      );
    }

    await connection.commit();

    res.status(200).json({
      message: "Ticket updated successfully",
    });
  } catch (error) {
    if (transactionStarted) {
      await connection.rollback();
    }

    console.error(error);

    res.status(500).json({
      message: "Failed to update ticket",
    });
  } finally {
    connection.release();
  }
};

export const deleteTicket = async (req: Request, res: Response) => {
  const connection = await pool.getConnection();

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

    const [rows] = await connection.execute(
      `SELECT
          id,
          status,
          created_by,
          assigned_to
       FROM tickets
       WHERE id = ?`,
      [ticketId],
    );

    const tickets = rows as {
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

    if (ticket.status === "CLOSED") {
      res.status(400).json({
        message: "Closed tickets cannot be modified",
      });
      return;
    }

    if (user.role === "CUSTOMER" && ticket.created_by !== user.userId) {
      res.status(403).json({
        message: "You can only delete your own tickets",
      });
      return;
    }

    if (user.role === "AGENT" && ticket.assigned_to !== user.userId) {
      res.status(403).json({
        message: "You can only delete tickets assigned to you",
      });
      return;
    }

    // Start transaction
    await connection.beginTransaction();

    // Delete comments
    await connection.execute(
      `DELETE FROM ticket_comments
       WHERE ticket_id = ?`,
      [ticketId],
    );

    // Delete history
    await connection.execute(
      `DELETE FROM ticket_history
       WHERE ticket_id = ?`,
      [ticketId],
    );

    // Delete ticket
    await connection.execute(
      `DELETE FROM tickets
       WHERE id = ?`,
      [ticketId],
    );

    // Commit transaction
    await connection.commit();

    res.status(200).json({
      message: "Ticket deleted successfully",
    });
  } catch (error) {
    await connection.rollback();

    console.error(error);

    res.status(500).json({
      message: "Failed to delete ticket",
    });
  } finally {
    connection.release();
  }
};

export const updateTicketStatus = async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  let transactionStarted = false;

  try {
    // Check authentication
    if (!req.user) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    const user = req.user;

    // Get ticket ID and status
    const ticketId = Number(req.params.id);
    const { status } = req.body;

    // Validate ticket ID
    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      res.status(400).json({
        message: "Invalid ticket ID",
      });
      return;
    }

    // Validate status
    const validStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

    if (typeof status !== "string" || !validStatuses.includes(status)) {
      res.status(400).json({
        message: "Invalid status",
      });
      return;
    }

    // Get current ticket information
    const [ticketRows] = await connection.execute(
      `SELECT
                id,
                status,
                created_by,
                assigned_to
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

    // Check ticket exists
    if (tickets.length === 0) {
      res.status(404).json({
        message: "Ticket not found",
      });
      return;
    }

    const ticket = tickets[0];

    // CLOSED tickets cannot be modified
    if (ticket.status === "CLOSED") {
      res.status(400).json({
        message: "Closed tickets cannot be modified",
      });
      return;
    }

    // CUSTOMER → can modify only their own tickets
    if (user.role === "CUSTOMER" && ticket.created_by !== user.userId) {
      res.status(403).json({
        message: "You can only modify your own tickets",
      });
      return;
    }

    // AGENT → can modify only tickets assigned to them
    if (user.role === "AGENT" && ticket.assigned_to !== user.userId) {
      res.status(403).json({
        message: "You can only modify tickets assigned to you",
      });
      return;
    }

    // Ticket cannot be resolved without an assigned agent
    if (status === "RESOLVED" && ticket.assigned_to === null) {
      res.status(400).json({
        message: "Ticket cannot be resolved without an assigned agent",
      });
      return;
    }

    if (ticket.status === status) {
      res.status(400).json({
        message: "Ticket is already in this status",
      });
      return;
    }

    const currentStatusIndex = validStatuses.indexOf(ticket.status);
    const nextStatus = validStatuses[currentStatusIndex + 1];

    if (status !== nextStatus) {
      res.status(400).json({
        message: "Invalid status transition",
      });
      return;
    }

    // Start transaction
    await connection.beginTransaction();
    transactionStarted = true;

    // Update ticket status
    await connection.execute(
      `UPDATE tickets
             SET status = ?
             WHERE id = ?`,
      [status, ticketId],
    );

    // Insert audit history
    await connection.execute(
      `INSERT INTO ticket_history
                (ticket_id, user_id, action, old_value, new_value)
             VALUES (?, ?, ?, ?, ?)`,
      [ticketId, user.userId, "STATUS_CHANGED", ticket.status, status],
    );

    // Commit transaction
    await connection.commit();

    res.status(200).json({
      message: "Ticket status updated successfully",
      ticketId,
      oldStatus: ticket.status,
      newStatus: status,
    });
  } catch (error) {
    // Rollback transaction if something fails
    if (transactionStarted) {
      await connection.rollback();
    }

    console.error(error);

    res.status(500).json({
      message: "Failed to update ticket status",
    });
  } finally {
    // Release connection back to pool
    connection.release();
  }
};

export const assignTicket = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    const user = req.user;

    if (user.role !== "ADMIN") {
      res.status(403).json({
        message: "Only ADMIN can assign tickets",
      });
      return;
    }
    const ticketId = Number(req.params.id);

    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      res.status(400).json({
        message: "Invalid ticket ID",
      });
      return;
    }

    const { assignedTo } = req.body;

    if (assignedTo === undefined || assignedTo === null) {
      res.status(400).json({
        message: "assignedTo is required",
      });
      return;
    }

    const agentId = Number(assignedTo);

    if (!Number.isInteger(agentId) || agentId <= 0) {
      res.status(400).json({
        message: "Invalid assigned user ID",
      });
      return;
    }

    const [ticketRows] = await pool.execute(
      `SELECT id, status, assigned_to
   FROM tickets
   WHERE id = ?`,
      [ticketId],
    );

    const tickets = ticketRows as {
      id: number;
      status: string;
      assigned_to: number | null;
    }[];

    if (tickets.length === 0) {
      res.status(404).json({
        message: "Ticket not found",
      });
      return;
    }

    // Closed tickets cannot be modified
    if (tickets[0].status === "CLOSED") {
      res.status(400).json({
        message: "Closed tickets cannot be modified",
      });
      return;
    }

    const oldAssignedTo = tickets[0].assigned_to;

    if (oldAssignedTo === agentId) {
      res.status(400).json({
        message: "Ticket is already assigned to this agent",
      });
      return;
    }

    // Check assigned user
    const [userRows] = await pool.execute(
      `SELECT id, role
             FROM users
             WHERE id = ?`,
      [agentId],
    );

    const users = userRows as {
      id: number;
      role: string;
    }[];

    if (users.length === 0) {
      res.status(404).json({
        message: "Assigned user not found",
      });
      return;
    }

    // Only AGENT can be assigned
    if (users[0].role !== "AGENT") {
      res.status(400).json({
        message: "Ticket can only be assigned to an AGENT",
      });
      return;
    }

    // Assign ticket
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      await connection.execute(
        `UPDATE tickets
     SET assigned_to = ?
     WHERE id = ?`,
        [agentId, ticketId],
      );

      await connection.execute(
        `INSERT INTO ticket_history
      (ticket_id, user_id, action, old_value, new_value)
     VALUES (?, ?, ?, ?, ?)`,
        [
          ticketId,
          user.userId,
          "ASSIGNED",
          oldAssignedTo === null ? null : String(oldAssignedTo),
          String(agentId),
        ],
      );

      await connection.commit();

      res.status(200).json({
        message: "Ticket assigned successfully",
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to assign ticket",
    });
  }
};

export const getTicketHistory = async (req: Request, res: Response) => {
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

    // Check whether ticket exists
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

    // CUSTOMER → own ticket only
    if (user.role === "CUSTOMER" && ticket.created_by !== user.userId) {
      res.status(403).json({
        message: "You can only view history of your own tickets",
      });
      return;
    }

    // AGENT → assigned tickets only
    if (user.role === "AGENT" && ticket.assigned_to !== user.userId) {
      res.status(403).json({
        message: "You can only view history of tickets assigned to you",
      });
      return;
    }

    const [rows] = await pool.execute(
      `SELECT
          ticket_history.id,
          ticket_history.action,
          ticket_history.old_value,
          ticket_history.new_value,
          ticket_history.created_at,
          users.id AS user_id,
          users.name AS user_name,
          users.email AS user_email
       FROM ticket_history
       LEFT JOIN users
          ON ticket_history.user_id = users.id
       WHERE ticket_history.ticket_id = ?
       ORDER BY ticket_history.created_at ASC`,
      [ticketId],
    );

    res.status(200).json({
      ticketId,
      history: rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch ticket history",
    });
  }
};
