"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import type { Ticket, TicketListResponse } from "@/types/ticket";
import type { User } from "@/types/user";

type DashboardUser = Pick<User, "id" | "name" | "email" | "role">;

export default function UserDashboard() {
  const router = useRouter();

  const [user, setUser] = useState<DashboardUser | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [totalTickets, setTotalTickets] = useState(0);
  const [openTickets, setOpenTickets] = useState(0);
  const [resolvedTickets, setResolvedTickets] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        // Get current logged-in user
        const userResponse = await api.get("/auth/me");
        const currentUser = userResponse.data;

        // Make sure this page is only accessible to customers
        if (currentUser.role !== "CUSTOMER") {
          if (currentUser.role === "ADMIN") {
            router.push("/admin");
          } else if (currentUser.role === "AGENT") {
            router.push("/agent");
          } else {
            router.push("/login");
          }

          return;
        }

        setUser(currentUser);

        // Get customer's tickets
        const [ticketsResponse, openResponse, resolvedResponse, closedResponse] =
          await Promise.all([
            api.get<TicketListResponse>("/tickets", {
              params: { limit: 5 },
            }),
            api.get<TicketListResponse>("/tickets", {
              params: { limit: 1, status: "OPEN" },
            }),
            api.get<TicketListResponse>("/tickets", {
              params: { limit: 1, status: "RESOLVED" },
            }),
            api.get<TicketListResponse>("/tickets", {
              params: { limit: 1, status: "CLOSED" },
            }),
          ]);

        setTickets(ticketsResponse.data.tickets);
        setTotalTickets(ticketsResponse.data.totalTickets);
        setOpenTickets(openResponse.data.totalTickets);
        setResolvedTickets(
          resolvedResponse.data.totalTickets + closedResponse.data.totalTickets,
        );
      } catch (error) {
        console.error(error);
        setError("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-slate-500">Loading dashboard...</p>
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
            Welcome back, {user?.name}
          </h1>

          <p className="mt-2 text-slate-500">
            Overview of your support tickets.
          </p>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Total Tickets */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-medium text-slate-500">Total Tickets</p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {totalTickets}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              All your support requests
            </p>
          </div>

          {/* Open Tickets */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-medium text-slate-500">Open Tickets</p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {openTickets}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Currently requiring attention
            </p>
          </div>

          {/* Resolved Tickets */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-medium text-slate-500">Resolved</p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {resolvedTickets}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Resolved or closed tickets
            </p>
          </div>
        </div>

        {/* Recent Tickets */}
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Recent Tickets
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your latest support requests.
              </p>
            </div>

            <Link
              href="/user/tickets"
              className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-700"
            >
              View all tickets →
            </Link>
          </div>

          {/* No Tickets */}
          {tickets.length === 0 && (
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <h3 className="text-base font-semibold text-slate-900">
                No tickets yet
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                You have not created any support tickets yet.
              </p>

              <Link
                href="/user/tickets/create"
                className="mt-4 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Create your first ticket →
              </Link>
            </div>
          )}

          {/* Recent Ticket List */}
          {tickets.length > 0 && (
            <div className="mt-5 space-y-3">
              {tickets.slice(0, 3).map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/user/tickets/${ticket.id}`}
                  className="group block rounded-xl border border-slate-200 bg-white p-5 transition hover:border-indigo-200 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-400">
                          #{ticket.id}
                        </span>

                        <h3 className="truncate text-sm font-semibold text-slate-900 group-hover:text-indigo-600">
                          {ticket.title}
                        </h3>
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
                    <span className="text-slate-400">Priority</span>

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

                    <span className="text-slate-300">•</span>

                    <span className="text-slate-400">
                      Updated{" "}
                      {new Date(ticket.updated_at).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
