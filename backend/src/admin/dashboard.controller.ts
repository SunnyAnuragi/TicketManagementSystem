import { Request, Response } from "express";
import pool from "../db/connection.js";

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [userRows] = await pool.execute(`
  SELECT
    COUNT(*) AS total,
    SUM(role = 'CUSTOMER') AS customers,
    SUM(role = 'AGENT') AS agents,
    SUM(role = 'ADMIN') AS admins
  FROM users
`);

    const [ticketRows] = await pool.execute(`
  SELECT
    COUNT(*) AS total,
    COALESCE(SUM(status IN ('RESOLVED', 'CLOSED')), 0) AS resolved
  FROM tickets
`);

    const users = userRows as {
      total: number;
      customers: number;
      agents: number;
      admins: number;
    }[];

    const tickets = ticketRows as {
      total: number;
      resolved: number;
    }[];

    const userStats = users[0];
    const ticketStats = tickets[0];

    res.status(200).json({
      users: {
        total: userStats.total,
        customers: userStats.customers,
        agents: userStats.agents,
        admins: userStats.admins,
      },
      tickets: {
        total: ticketStats.total,
        resolved: ticketStats.resolved,
        remaining: ticketStats.total - ticketStats.resolved,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch dashboard statistics",
    });
  }
};
