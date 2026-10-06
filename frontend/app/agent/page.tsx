"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import type { Ticket, TicketListResponse } from "@/types/ticket";
import type { User } from "@/types/user";

type DashboardUser = Pick<User, "id" | "name" | "email" | "role">;

export default function AgentDashboard() {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState<DashboardUser | null>(null);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [assignedCount, setAssignedCount] = useState(0);
  const [openCount, setOpenCount] = useState(0);
  const [inProgressCount, setInProgressCount] = useState(0);
  const [resolvedCount, setResolvedCount] = useState(0);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [ticketError, setTicketError] = useState("");

  const fetchTickets = async () => {
    try {
      setLoadingTickets(true);
      setTicketError("");

      const [
        ticketsResponse,
        openResponse,
        inProgressResponse,
        resolvedResponse,
        closedResponse,
      ] = await Promise.all([
        api.get<TicketListResponse>("/tickets", { params: { limit: 5 } }),
        api.get<TicketListResponse>("/tickets", {
          params: { limit: 1, status: "OPEN" },
        }),
        api.get<TicketListResponse>("/tickets", {
          params: { limit: 1, status: "IN_PROGRESS" },
        }),
        api.get<TicketListResponse>("/tickets", {
          params: { limit: 1, status: "RESOLVED" },
        }),
        api.get<TicketListResponse>("/tickets", {
          params: { limit: 1, status: "CLOSED" },
        }),
      ]);

      setTickets(ticketsResponse.data.tickets);
      setAssignedCount(ticketsResponse.data.totalTickets);
      setOpenCount(openResponse.data.totalTickets);
      setInProgressCount(inProgressResponse.data.totalTickets);
      setResolvedCount(
        resolvedResponse.data.totalTickets + closedResponse.data.totalTickets,
      );
    } catch (error) {
      console.error(error);
      setTicketError("Failed to load tickets");
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    const checkAgent = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await api.get("/auth/me");

        const currentUser = response.data;

        if (currentUser.role === "AGENT") {
          setUser(currentUser);
          setCheckingAuth(false);

          await fetchTickets();
          return;
        }

        if (currentUser.role === "CUSTOMER") {
          router.push("/user");
        } else if (currentUser.role === "ADMIN") {
          router.push("/admin");
        } else {
          router.push("/login");
        }
      } catch (error) {
        console.error(error);

        localStorage.removeItem("token");
        router.push("/login");
      }
    };

    checkAgent();
  }, [router]);

  if (checkingAuth) {
    return (
      <main className="min-h-full">
        <div className="flex min-h-[400px] items-center justify-center">
          <p className="text-sm text-slate-500">Checking authorization...</p>
        </div>
      </main>
    );
  }

  const recentTickets = tickets.slice(0, 5);

  return (
    <main className="min-h-full">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div>
          {/* <p className="text-sm font-semibold text-indigo-600">
            Agent Workspace
          </p> */}

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Welcome back{user ? `, ${user.name}` : ""}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage your assigned tickets and respond to customer issues.
          </p>
        </div>

        {/* Overview */}
        <section className="mt-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {/* Assigned */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-medium text-slate-500">
                Assigned Tickets
              </p>

              <p className="mt-3 text-3xl font-bold text-slate-900">
                {assignedCount}
              </p>
            </div>

            {/* Open */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-medium text-slate-500">Open</p>

              <p className="mt-3 text-3xl font-bold text-blue-600">
                {openCount}
              </p>
            </div>

            {/* In Progress */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-medium text-slate-500">In Progress</p>

              <p className="mt-3 text-3xl font-bold text-amber-600">
                {inProgressCount}
              </p>
            </div>

            {/* Resolved */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-medium text-slate-500">Resolved</p>

              <p className="mt-3 text-3xl font-bold text-emerald-600">
                {resolvedCount}
              </p>
            </div>
          </div>
        </section>

        {/* Recent Tickets */}
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Recent Assigned Tickets
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                A quick view of your latest assigned tickets.
              </p>
            </div>

            <Link
              href="/agent/tickets"
              className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-700"
            >
              View all
            </Link>
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {loadingTickets && (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-500">Loading tickets...</p>
              </div>
            )}

            {ticketError && !loadingTickets && (
              <div className="p-8 text-center">
                <p className="text-sm text-red-600">{ticketError}</p>
              </div>
            )}

            {!loadingTickets && !ticketError && recentTickets.length === 0 && (
              <div className="p-10 text-center">
                <h3 className="text-sm font-semibold text-slate-900">
                  No tickets assigned
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Tickets assigned to you will appear here.
                </p>
              </div>
            )}

            {!loadingTickets && !ticketError && recentTickets.length > 0 && (
              <div className="divide-y divide-slate-100">
                {recentTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex flex-col gap-4 px-5 py-5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-400">
                          #{ticket.id}
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
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

                      <h3 className="mt-2 truncate text-sm font-semibold text-slate-900">
                        {ticket.title}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Customer: {ticket.creator_name}
                      </p>
                    </div>

                    <Link
                      href={`/agent/tickets/${ticket.id}`}
                      className="shrink-0 text-sm font-semibold text-indigo-600 transition hover:text-indigo-700"
                    >
                      View ticket
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
