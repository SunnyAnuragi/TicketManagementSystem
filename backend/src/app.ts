import express from "express";
import healthRouter from "./routes/health.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import userRouter from "./routes/user.routes.js";
import ticketRouter from "./routes/ticket.routes.js";
import commentRouter from "./routes/comment.routes.js";
import authRouter from "./auth/auth.routes.js";
import agentRouter from "./admin/agent.routes.js";
import dashboardRouter from "./admin/dashboard.routes.js";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.json());
app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
  }),
);

console.log("Registered ticket routes");
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Ticket Management System Backend",
  });
});

app.use("/health", healthRouter);
app.use("/users", userRouter);
app.use("/tickets", ticketRouter);
app.use("/tickets", commentRouter);
app.use("/auth", authRouter);
app.use("/admin/agents", agentRouter);
app.use("/admin/dashboard", dashboardRouter);

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

app.use(errorHandler);

export default app;
