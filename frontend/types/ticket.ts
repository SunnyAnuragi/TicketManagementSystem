export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export type Ticket = {
  id: number;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  created_by?: number;
  assigned_to?: number | null;
  created_at: string;
  updated_at: string;
  creator_id?: number;
  creator_name?: string;
  creator_email?: string;
  assigned_agent_name?: string | null;
  assignee_name?: string | null;
};

export type TicketListResponse = {
  tickets: Ticket[];
  page: number;
  limit: number;
  totalTickets: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type TicketComment = {
  id: number;
  ticket_id: number;
  user_id: number;
  message: string;
  created_at: string;
  user_name: string;
  user_email: string;
};

export type TicketHistory = {
  id: number;
  ticket_id: number;
  user_id: number | null;
  action: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  user_name?: string | null;
  user_email?: string | null;
};
