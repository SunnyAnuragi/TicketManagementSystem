import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        message: "Authentication token required",
      });
      return;
    }

    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      res.status(401).json({
        message: "Invalid authorization format",
      });
      return;
    }

    const token = parts[1];

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET is not configured");
    }

    const decoded = jwt.verify(token, secret);

    if (typeof decoded === "string") {
      res.status(401).json({
        message: "Invalid token",
      });
      return;
    }

    req.user = {
      userId: decoded.userId as number,
      role: decoded.role as string,
    };

    next();
  } catch (error) {
    console.error(error);

    res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};
