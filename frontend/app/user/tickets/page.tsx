"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import api from "@/lib/axios";
import type { Ticket, TicketListResponse } from "@/types/ticket";

export default function MyTicketsPage() {
  const router = useRouter();

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
    const loadTickets = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const userResponse = await api.get("/auth/me");

        if (userResponse.data.role !== "CUSTOMER") {
          if (userResponse.data.role === "ADMIN") {
            router.push("/admin");
          } else if (userResponse.data.role === "AGENT") {
            router.push("/agent");
          } else {
            router.push("/login");
          }

          return;
        }

        const response = await api.get<TicketListResponse>("/tickets", {
          params: { page, limit: 10 },
        });

        setTickets(response.data.tickets);
        setTotalPages(response.data.totalPages);
        setTotalTickets(response.data.totalTickets);
      } catch (error) {
        console.error(error);
        setError("Failed to load your tickets");
      } finally {
        setLoading(false);
      }
    };

    loadTickets();
  }, [router, page]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        ticket.title.toLowerCase().includes(searchText) ||
        ticket.description.toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === "ALL" ||
        ticket.status === statusFilter;

      const matchesPriority =
        priorityFilter === "ALL" ||
        ticket.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, search, statusFilter, priorityFilter]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-slate-500">
          Loading tickets...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <main className="min-h-full">
      <div className="mx-auto max-w-7xl">

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            My Tickets
          </h1>

          <p className="mt-2 text-slate-500">
            View and manage all your support requests.
          </p>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">

            {/* Search */}
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tickets..."
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>

            {/* Priority */}
            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>

          </div>
        </div>

        {/* Result Count */}
        <div className="mt-6">
          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-medium text-slate-700">
              {filteredTickets.length}
            </span>{" "}
            {filteredTickets.length === 1 ? "ticket" : "tickets"}
          </p>
        </div>

        {/* Empty State */}
        {filteredTickets.length === 0 && (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h3 className="text-base font-semibold text-slate-900">
              No tickets found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or filters.
            </p>
          </div>
        )}

        {/* Ticket List */}
        {filteredTickets.length > 0 && (
          <div className="mt-4 space-y-3">

            {filteredTickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/user/tickets/${ticket.id}`}
                className="group block rounded-xl border border-slate-200 bg-white p-5 transition hover:border-indigo-200 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-6">

                  {/* Ticket Information */}
                  <div className="min-w-0">

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-400">
                        #{ticket.id}
                      </span>

                      <h2 className="truncate text-sm font-semibold text-slate-900 group-hover:text-indigo-600">
                        {ticket.title}
                      </h2>
                    </div>

                    <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                      {ticket.description}
                    </p>

                  </div>

                  {/* Status */}
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                      ticket.status === "OPEN"
                        ? "bg-blue-50 text-blue-700"
                        : ticket.status === "IN_PROGRESS"
                          ? "bg-amber-50 text-amber-700"
                          : ticket.status === "RESOLVED"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {ticket.status}
                  </span>

                </div>

                {/* Metadata */}
                <div className="mt-4 flex items-center gap-4 text-xs">

                  <span className="text-slate-400">
                    Priority
                  </span>

                  <span
                    className={`font-semibold ${
                      ticket.priority === "CRITICAL"
                        ? "text-red-600"
                        : ticket.priority === "HIGH"
                          ? "text-orange-600"
                          : ticket.priority === "MEDIUM"
                            ? "text-blue-600"
                            : "text-slate-500"
                    }`}
                  >
                    {ticket.priority}
                  </span>

                  <span className="text-slate-300">
                    •
                  </span>

                  <span className="text-slate-400">
                    Updated{" "}
                    {new Date(
                      ticket.updated_at,
                    ).toLocaleDateString("en-IN")}
                  </span>

                </div>
              </Link>
            ))}

          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Page {page} of {totalPages} · {totalTickets} tickets
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