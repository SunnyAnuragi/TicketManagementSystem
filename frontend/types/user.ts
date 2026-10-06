export type UserRole = "ADMIN" | "AGENT" | "CUSTOMER";

export type AuthUser = {
  userId: number;
  role: UserRole;
  email?: string;
  name?: string;
};

export type User = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
};

export type Agent = {
  id: number;
  name: string;
  email: string;
  role: "AGENT";
  skills?: string | null;
  address?: string | null;
  experience?: number | null;
  created_at: string;
};

export type DashboardStats = {
  totalTickets: number;
  resolvedTickets: number;
  remainingTickets: number;
  totalUsers: number;
  customers: number;
  agents: number;
  admins: number;
};
