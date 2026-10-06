"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import type { Ticket, TicketListResponse } from "@/types/ticket";

type Agent = {
  id: number;
  name: string;
  email: string;
};

const STATUS_OPTIONS = ["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

const PRIORITY_OPTIONS = ["ALL", "LOW", "MEDIUM", "HIGH", "CRITICAL"];

export default function AdminTicketsPage() {
  const router = useRouter();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTickets, setTotalTickets] = useState(0);
  const [agents, setAgents] = useState<Agent[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  const [selectedAgents, setSelectedAgents] = useState<Record<number, string>>(
    {},
  );

  const [assigningTicketId, setAssigningTicketId] = useState<number | null>(
    null,
  );

  const [assignError, setAssignError] = useState("");
  const [assignSuccess, setAssignSuccess] = useState("");

  useEffect(() => {
    const checkAdminAndFetchData = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const userResponse = await api.get("/auth/me");

        if (userResponse.data.role !== "ADMIN") {
          if (userResponse.data.role === "AGENT") {
            router.push("/agent");
          } else {
            router.push("/user");
          }

          return;
        }

        const [ticketsResponse, agentsResponse] = await Promise.all([
          api.get<TicketListResponse>("/tickets", {
            params: { page, limit: 10 },
          }),
          api.get("/admin/agents"),
        ]);

        setTickets(ticketsResponse.data.tickets || []);
        setTotalPages(ticketsResponse.data.totalPages);
        setTotalTickets(ticketsResponse.data.totalTickets);
        setAgents(agentsResponse.data.agents || []);
      } catch (err) {
        console.error("Failed to load admin tickets:", err);
        setError("Failed to load tickets.");
      } finally {
        setLoading(false);
      }
    };

    checkAdminAndFetchData();
  }, [router, page]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const searchValue = search.toLowerCase().trim();

      const matchesSearch =
        !searchValue ||
        ticket.title.toLowerCase().includes(searchValue) ||
        ticket.description.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "ALL" || ticket.status === statusFilter;

      const matchesPriority =
        priorityFilter === "ALL" || ticket.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, search, statusFilter, priorityFilter]);

  const handleAssignTicket = async (ticketId: number) => {
    const selectedAgentId = selectedAgents[ticketId];

    if (!selectedAgentId) {
      setAssignError("Please select an agent.");
      return;
    }

    try {
      setAssigningTicketId(ticketId);
      setAssignError("");
      setAssignSuccess("");

      await api.patch(`/tickets/${ticketId}/assign`, {
        assignedTo: Number(selectedAgentId),
      });

      setTickets((currentTickets) =>
        currentTickets.map((ticket) => {
          if (ticket.id !== ticketId) {
            return ticket;
          }

          const assignedAgent = agents.find(
            (agent) => agent.id === Number(selectedAgentId),
          );

          return {
            ...ticket,
            assigned_to: Number(selectedAgentId),
            assigned_agent_name: assignedAgent?.name || null,
          };
        }),
      );

      setAssignSuccess(`Ticket #${ticketId} assigned successfully.`);

      setSelectedAgents((current) => ({
        ...current,
        [ticketId]: "",
      }));
    } catch (err) {
      console.error("Failed to assign ticket:", err);
      setAssignError("Failed to assign ticket.");
    } finally {
      setAssigningTicketId(null);
    }
  };

  const getStatusClasses = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-blue-50 text-blue-700 border-blue-200";

      case "IN_PROGRESS":
        return "bg-amber-50 text-amber-700 border-amber-200";

      case "RESOLVED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";

      case "CLOSED":
        return "bg-slate-100 text-slate-600 border-slate-200";

      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const getPriorityClasses = (priority: string) => {
    switch (priority) {
      case "LOW":
        return "bg-slate-100 text-slate-600 border-slate-200";

      case "MEDIUM":
        return "bg-blue-50 text-blue-700 border-blue-200";

      case "HIGH":
        return "bg-orange-50 text-orange-700 border-orange-200";

      case "CRITICAL":
        return "bg-red-50 text-red-700 border-red-200";

      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <p className="text-sm text-slate-500">Loading tickets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section>
        <p className="text-sm font-medium text-indigo-600">Admin Workspace</p>

        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
          All Tickets
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Review customer tickets, manage assignments, and open ticket details.
        </p>
      </section>

      {/* Filters */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="grid gap-4 md:grid-cols-[1fr_180px_180px]">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Search
            </label>

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title or description..."
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Status
            </label>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status === "ALL" ? "All Statuses" : status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Priority
            </label>

            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              {PRIORITY_OPTIONS.map((priority) => (
                <option key={priority} value={priority}>
                  {priority === "ALL" ? "All Priorities" : priority}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Messages */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {assignError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{assignError}</p>
        </div>
      )}

      {assignSuccess && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-sm text-emerald-700">{assignSuccess}</p>
        </div>
      )}

      {/* Result count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Showing{" "}
          <span className="font-medium text-slate-900">
            {filteredTickets.length}
          </span>{" "}
          of{" "}
          <span className="font-medium text-slate-900">{totalTickets}</span>{" "}
          tickets
        </p>
      </div>

      {/* Tickets */}
      {filteredTickets.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center">
          <h2 className="text-lg font-semibold text-slate-900">
            No tickets found
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Try changing your search or filter criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-sm"
            >
              {/* Ticket header */}
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-400">
                    Ticket #{ticket.id}
                  </p>

                  <h2 className="mt-1 truncate text-base font-semibold text-slate-900">
                    {ticket.title}
                  </h2>

                  <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                    {ticket.description}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                      ticket.status,
                    )}`}
                  >
                    {ticket.status}
                  </span>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getPriorityClasses(
                      ticket.priority,
                    )}`}
                  >
                    {ticket.priority}
                  </span>
                </div>
              </div>

              {/* Ticket information */}
              <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 md:grid-cols-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Customer
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {ticket.creator_name}
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    {ticket.creator_email}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Assigned Agent
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {ticket.assigned_agent_name || "Not assigned"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Created
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {new Date(ticket.created_at).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {/* Assignment */}
              <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="w-full lg:max-w-sm">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Assign Agent
                  </label>

                  <select
                    value={selectedAgents[ticket.id] || ""}
                    onChange={(event) => {
                      setSelectedAgents((current) => ({
                        ...current,
                        [ticket.id]: event.target.value,
                      }));

                      setAssignError("");
                      setAssignSuccess("");
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="">Select an agent</option>

                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name} — {agent.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleAssignTicket(ticket.id)}
                    disabled={assigningTicketId === ticket.id}
                    className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {assigningTicketId === ticket.id
                      ? "Assigning..."
                      : "Assign Agent"}
                  </button>

                  <Link
                    href={`/admin/tickets/${ticket.id}`}
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
                  >
                    View Ticket
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => current - 1)}
              disabled={page === 1}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              disabled={page === totalPages}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
