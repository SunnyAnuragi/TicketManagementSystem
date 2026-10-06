"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import type { Ticket, TicketListResponse } from "@/types/ticket";

const getStatusClasses = (status: string) => {
  switch (status) {
    case "OPEN":
      return "bg-blue-50 text-blue-700";

    case "IN_PROGRESS":
      return "bg-amber-50 text-amber-700";

    case "RESOLVED":
      return "bg-emerald-50 text-emerald-700";

    case "CLOSED":
      return "bg-slate-100 text-slate-600";

    default:
      return "bg-slate-100 text-slate-600";
  }
};

const getPriorityClasses = (priority: string) => {
  switch (priority) {
    case "CRITICAL":
      return "bg-red-50 text-red-700";

    case "HIGH":
      return "bg-orange-50 text-orange-700";

    case "MEDIUM":
      return "bg-blue-50 text-blue-700";

    case "LOW":
      return "bg-slate-100 text-slate-600";

    default:
      return "bg-slate-100 text-slate-600";
  }
};

export default function AgentTicketsPage() {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTickets, setTotalTickets] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  useEffect(() => {
    const checkAgentAndFetchTickets = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const userResponse = await api.get("/auth/me");

        const currentUser = userResponse.data;

        if (currentUser.role !== "AGENT") {
          if (currentUser.role === "CUSTOMER") {
            router.push("/user");
          } else if (currentUser.role === "ADMIN") {
            router.push("/admin");
          } else {
            router.push("/login");
          }

          return;
        }

        setCheckingAuth(false);

        const ticketResponse = await api.get<TicketListResponse>("/tickets", {
          params: { page, limit: 10 },
        });

        setTickets(ticketResponse.data.tickets);
        setTotalPages(ticketResponse.data.totalPages);
        setTotalTickets(ticketResponse.data.totalTickets);
      } catch (error) {
        console.error(error);

        localStorage.removeItem("token");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAgentAndFetchTickets();
  }, [router, page]);

  const filteredTickets = tickets.filter((ticket) => {
    const searchValue = search.toLowerCase().trim();

    const matchesSearch =
      ticket.title.toLowerCase().includes(searchValue) ||
      ticket.description.toLowerCase().includes(searchValue);

    const matchesStatus =
      statusFilter === "ALL" || ticket.status === statusFilter;

    const matchesPriority =
      priorityFilter === "ALL" || ticket.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (checkingAuth) {
    return (
      <main className="min-h-full">
        <div className="flex min-h-[400px] items-center justify-center">
          <p className="text-sm text-slate-500">Checking authorization...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-full">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div>
          <p className="text-sm font-semibold text-indigo-600">
            Agent Workspace
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Assigned Tickets
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            View and manage tickets currently assigned to you.
          </p>
        </div>

        {/* Filters */}
        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_180px_180px]">
            {/* Search */}
            <div>
              <label
                htmlFor="search"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Search
              </label>

              <input
                id="search"
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tickets..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* Status */}
            <div>
              <label
                htmlFor="status"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Status
              </label>

              <select
                id="status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label
                htmlFor="priority"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Priority
              </label>

              <select
                id="priority"
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="ALL">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>
        </section>

        {/* Results */}
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {filteredTickets.length}{" "}
            {filteredTickets.length === 1 ? "ticket" : "tickets"} found
          </p>
        </div>

        {/* Ticket List */}
        <section className="mt-4">
          {loading && (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
              <p className="text-sm text-slate-500">Loading tickets...</p>
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {!loading && !error && filteredTickets.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
              <h2 className="text-sm font-semibold text-slate-900">
                No tickets found
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or filters.
              </p>
            </div>
          )}

          {!loading && !error && filteredTickets.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="divide-y divide-slate-100">
                {filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-5 transition hover:bg-slate-50"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      {/* Main information */}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-slate-400">
                            #{ticket.id}
                          </span>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                              ticket.status,
                            )}`}
                          >
                            {ticket.status}
                          </span>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getPriorityClasses(
                              ticket.priority,
                            )}`}
                          >
                            {ticket.priority}
                          </span>
                        </div>

                        <h2 className="mt-2 text-base font-semibold text-slate-900">
                          {ticket.title}
                        </h2>

                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                          {ticket.description}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
                          <span>
                            Customer:{" "}
                            <span className="font-medium text-slate-700">
                              {ticket.creator_name}
                            </span>
                          </span>

                          <span>{ticket.creator_email}</span>
                        </div>
                      </div>

                      {/* Action */}
                      <Link
                        href={`/agent/tickets/${ticket.id}`}
                        className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-indigo-700"
                      >
                        View Ticket
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Page {page} of {totalPages} · {totalTickets} assigned tickets
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
    </main>
  );
}
