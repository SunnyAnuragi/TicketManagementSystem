"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import type { DashboardStats, User } from "@/types/user";

type DashboardUser = Pick<User, "id" | "name" | "email" | "role">;

export default function AdminDashboard() {
  const router = useRouter();

  const [user, setUser] = useState<DashboardUser | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalTickets: 0,
    resolvedTickets: 0,
    remainingTickets: 0,
    totalUsers: 0,
    customers: 0,
    agents: 0,
    admins: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkAdmin = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const userResponse = await api.get("/auth/me");
        const currentUser: User = userResponse.data;

        if (currentUser.role !== "ADMIN") {
          if (currentUser.role === "AGENT") {
            router.push("/agent");
          } else {
            router.push("/user");
          }

          return;
        }

        setUser(currentUser);

        const statsResponse = await api.get("/admin/dashboard/stats");

        const data = statsResponse.data;

        setStats({
          totalTickets: Number(data.tickets.total),
          resolvedTickets: Number(data.tickets.resolved),
          remainingTickets: Number(data.tickets.remaining),
          totalUsers: Number(data.users.total),
          customers: Number(data.users.customers),
          agents: Number(data.users.agents),
          admins: Number(data.users.admins),
        });
      } catch (err) {
        console.error("Admin dashboard error:", err);
        setError("Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <p className="text-sm text-slate-500">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <p className="text-sm font-medium text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <section>
        <p className="text-sm font-medium text-indigo-600">Admin Workspace</p>

        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
          Welcome back, {user?.name}
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Monitor tickets, users, and support operations from one place.
        </p>
      </section>

      {/* Ticket Overview */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Ticket Overview
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Current state of the support ticket system.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <StatCard
            label="Total Tickets"
            value={stats.totalTickets}
            description="All tickets in the system"
          />

          <StatCard
            label="Resolved Tickets"
            value={stats.resolvedTickets}
            description="Resolved or closed tickets"
          />

          <StatCard
            label="Remaining Tickets"
            value={stats.remainingTickets}
            description="Tickets still requiring attention"
          />
        </div>
      </section>

      {/* User Overview */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            User Overview
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Breakdown of users by role.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Users"
            value={stats.totalUsers}
            description="All registered users"
          />

          <StatCard
            label="Customers"
            value={stats.customers}
            description="Users creating tickets"
          />

          <StatCard
            label="Agents"
            value={stats.agents}
            description="Support agents"
          />

          <StatCard
            label="Admins"
            value={stats.admins}
            description="System administrators"
          />
        </div>
      </section>

      {/* Quick Access */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Quick Access</h2>

          <p className="mt-1 text-sm text-slate-500">
            Jump directly to the main administration workspaces.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <QuickAccessCard
            title="All Tickets"
            description="Review tickets and manage assignments."
            href="/admin/tickets"
          />

          <QuickAccessCard
            title="Agents"
            description="Manage support agents and their information."
            href="/admin/agents"
          />

          <QuickAccessCard
            title="Customers"
            description="View registered customers and accounts."
            href="/admin/users"
          />
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>

      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function QuickAccessCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-indigo-300 hover:bg-indigo-50/30"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600">
          {title}
        </h3>

        <span className="text-slate-400 transition-colors group-hover:text-indigo-600">
          →
        </span>
      </div>

      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </Link>
  );
}
