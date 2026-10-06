import { Request, Response } from "express";
import bcrypt from "bcrypt";
import pool from "../db/connection.js";
import jwt from "jsonwebtoken";

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      res.status(400).json({
        message: "name, email and password are required",
      });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({
        message: "Password must be at least 8 characters",
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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Public registration always creates CUSTOMER
    const [result] = await pool.execute(
      `INSERT INTO users
          (name, email, password, role)
       VALUES (?, ?, ?, ?)`,
      [name, email, hashedPassword, "CUSTOMER"],
    );

    const insertResult = result as {
      insertId: number;
    };

    res.status(201).json({
      message: "User registered successfully",
      userId: insertResult.insertId,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to register user",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({
        message: "email and password are required",
      });
      return;
    }

    // Find user
    const [rows] = await pool.execute(
      `SELECT id, name, email, password, role
             FROM users
             WHERE email = ?`,
      [email],
    );

    const users = rows as {
      id: number;
      name: string;
      email: string;
      password: string;
      role: string;
    }[];

    if (users.length === 0) {
      res.status(401).json({
        message: "Invalid email or password",
      });
      return;
    }

    const user = users[0];

    // Compare password with bcrypt hash
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      res.status(401).json({
        message: "Invalid email or password",
      });
      return;
    }

    // Create JWT
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET is not configured");
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      secret,
      {
        expiresIn: "1h",
      },
    );

    res.status(200).json({
      message: "Login successful",
      token,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to login",
    });
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    const [rows] = await pool.execute(
      `SELECT id, name, email, role
       FROM users
       WHERE id = ?`,
      [userId],
    );

    const users = rows as {
      id: number;
      name: string;
      email: string;
      role: string;
    }[];

    if (users.length === 0) {
      res.status(404).json({
        message: "User not found",
      });
      return;
    }

    res.status(200).json(users[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to get current user",
    });
  }
};
