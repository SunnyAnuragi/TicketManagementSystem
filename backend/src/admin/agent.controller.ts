import { Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import pool from "../db/connection.js";

export const createAgent = async (req: Request, res: Response) => {
  try {
    const { name, email, skills, address, experience } = req.body;

    // Validate required fields
    if (!name || !email) {
      res.status(400).json({
        message: "name and email are required",
      });
      return;
    }

    // Validate experience if provided
    if (experience !== undefined && experience < 0) {
      res.status(400).json({
        message: "Experience cannot be negative",
      });
      return;
    }

    // Check whether email already exists
    const [rows] = await pool.execute(`SELECT id FROM users WHERE email = ?`, [
      email,
    ]);

    const users = rows as {
      id: number;
    }[];

    if (users.length > 0) {
      res.status(409).json({
        message: "Email already registered",
      });
      return;
    }

    // Generate a random temporary password
    const temporaryPassword = crypto.randomBytes(8).toString("hex");

    // Hash password before storing it
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Create Agent
    const [result] = await pool.execute(
      `INSERT INTO users
        (name, email, password, role, skills, address, experience)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        email,
        hashedPassword,
        "AGENT",
        skills || null,
        address || null,
        experience ?? null,
      ],
    );

    const insertResult = result as {
      insertId: number;
    };

    // Temporary development-only credential output
    console.log(
      `Agent created: ${email} | Temporary password: ${temporaryPassword}`,
    );

    res.status(201).json({
      message: "Agent created successfully",
      agentId: insertResult.insertId,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create agent",
    });
  }
};

export const getAgents = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
          id,
          name,
          email,
          skills,
          address,
          experience,
          created_at
       FROM users
       WHERE role = 'AGENT'
       ORDER BY created_at DESC`,
    );

    res.status(200).json({
      agents: rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch agents",
    });
  }
};

export const updateAgent = async (req: Request, res: Response) => {
  try {
    const agentId = Number(req.params.id);

    if (!Number.isInteger(agentId) || agentId <= 0) {
      res.status(400).json({
        message: "Invalid agent ID",
      });
      return;
    }

    const { name, skills, address, experience } = req.body;

    // Check whether the agent exists
    const [agentRows] = await pool.execute(
      `SELECT id
       FROM users
       WHERE id = ? AND role = 'AGENT'`,
      [agentId],
    );

    const agents = agentRows as { id: number }[];

    if (agents.length === 0) {
      res.status(404).json({
        message: "Agent not found",
      });
      return;
    }

    // Validate provided fields
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        res.status(400).json({
          message: "Name must be a non-empty string",
        });
        return;
      }
    }

    if (skills !== undefined && skills !== null) {
      if (typeof skills !== "string") {
        res.status(400).json({
          message: "Skills must be a string",
        });
        return;
      }
    }

    if (address !== undefined && address !== null) {
      if (typeof address !== "string") {
        res.status(400).json({
          message: "Address must be a string",
        });
        return;
      }
    }

    if (experience !== undefined && experience !== null) {
      if (
        typeof experience !== "number" ||
        !Number.isInteger(experience) ||
        experience < 0
      ) {
        res.status(400).json({
          message: "Experience must be a non-negative integer",
        });
        return;
      }
    }

    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (name !== undefined) {
      fields.push("name = ?");
      values.push(name.trim());
    }

    if (skills !== undefined) {
      fields.push("skills = ?");
      values.push(skills === null ? null : skills.trim());
    }

    if (address !== undefined) {
      fields.push("address = ?");
      values.push(address === null ? null : address.trim());
    }

    if (experience !== undefined) {
      fields.push("experience = ?");
      values.push(experience);
    }

    if (fields.length === 0) {
      res.status(400).json({
        message: "At least one field is required to update",
      });
      return;
    }

    values.push(agentId);

    await pool.execute(
      `UPDATE users
       SET ${fields.join(", ")}
       WHERE id = ? AND role = 'AGENT'`,
      values,
    );

    res.status(200).json({
      message: "Agent updated successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update agent",
    });
  }
};

export const getAgentById = async (req: Request, res: Response) => {
  try {
    const agentId = Number(req.params.id);

    if (!Number.isInteger(agentId) || agentId <= 0) {
      res.status(400).json({
        message: "Invalid agent ID",
      });
      return;
    }

    const [rows] = await pool.execute(
      `SELECT
          id,
          name,
          email,
          skills,
          address,
          experience,
          created_at
       FROM users
       WHERE id = ? AND role = 'AGENT'`,
      [agentId],
    );

    const agents = rows as {
      id: number;
      name: string;
      email: string;
      skills: string | null;
      address: string | null;
      experience: number | null;
      created_at: Date;
    }[];

    if (agents.length === 0) {
      res.status(404).json({
        message: "Agent not found",
      });
      return;
    }

    res.status(200).json({
      agent: agents[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch agent",
    });
  }
};
