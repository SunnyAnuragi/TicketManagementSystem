import { Request, Response } from "express";
import pool from "../db/connection.js";
import bcrypt from "bcrypt";

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      res.status(400).json({
        message: "name, email and password are required",
      });
      return;
    }

    // Validate password length
    if (password.length < 8) {
      res.status(400).json({
        message: "Password must be at least 8 characters",
      });
      return;
    }

    // Check if email already exists
    const [existingRows] = await pool.execute(
      `SELECT id FROM users WHERE email = ?`,
      [email],
    );

    const existingUsers = existingRows as {
      id: number;
    }[];

    if (existingUsers.length > 0) {
      res.status(409).json({
        message: "Email already registered",
      });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create CUSTOMER
    const [result] = await pool.execute(
      `INSERT INTO users (name, email, password, role)
       VALUES (?, ?, ?, ?)`,
      [name, email, hashedPassword, "CUSTOMER"],
    );

    const insertResult = result as {
      insertId: number;
    };

    res.status(201).json({
      message: "User created successfully",
      userId: insertResult.insertId,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create user",
    });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, name, email, role, created_at FROM users",
    );

    res.status(200).json({
      users: rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch users",
    });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      res.status(400).json({
        message: "Invalid user ID",
      });
      return;
    }

    const [rows] = await pool.execute(
      "SELECT id, name, email, role, created_at FROM users WHERE id = ?",
      [userId],
    );

    const users = rows as {
      id: number;
      name: string;
      email: string;
      role: string;
      created_at: Date;
    }[];

    if (users.length === 0) {
      res.status(404).json({
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      user: users[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch user",
    });
  }
};
