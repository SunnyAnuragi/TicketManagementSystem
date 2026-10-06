"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import type { User } from "@/types/user";

type SettingsUser = Pick<User, "id" | "name" | "email" | "role">;

export default function AgentSettingsPage() {
  const router = useRouter();

  const [user, setUser] = useState<SettingsUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await api.get("/auth/me");

        const currentUser = response.data;

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

        setUser(currentUser);
      } catch (error) {
        console.error(error);

        localStorage.removeItem("token");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (loading) {
    return (
      <main className="min-h-full">
        <div className="flex min-h-[400px] items-center justify-center">
          <p className="text-sm text-slate-500">Loading settings...</p>
        </div>
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className="min-h-full">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-600">
            {error || "Unable to load profile"}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-full">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div>
          <p className="text-sm font-semibold text-indigo-600">Account</p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Settings
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            View your account information and manage your session.
          </p>
        </div>

        {/* Profile */}
        <section className="mt-8 rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-900">Profile</h2>

            <p className="mt-1 text-sm text-slate-500">
              Your account information.
            </p>
          </div>

          <div className="p-6">
            {/* Avatar */}
            <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-lg font-semibold text-indigo-700">
                {user.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>

              <div>
                <p className="text-base font-semibold text-slate-900">
                  {user.name}
                </p>

                <p className="mt-1 text-sm text-slate-500">Agent</p>
              </div>
            </div>

            {/* Account information */}
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Full Name
                </p>

                <p className="mt-2 text-sm font-medium text-slate-900">
                  {user.name}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Email Address
                </p>

                <p className="mt-2 text-sm font-medium text-slate-900">
                  {user.email}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Role
                </p>

                <span className="mt-2 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  {user.role}
                </span>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Account ID
                </p>

                <p className="mt-2 text-sm font-medium text-slate-900">
                  #{user.id}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Account Actions */}
        <section className="mt-6 rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-900">Account</h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage your current session.
            </p>
          </div>

          <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Sign out</p>

              <p className="mt-1 text-sm text-slate-500">
                Sign out of your current account on this device.
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </section>

        {/* Back */}
        <div className="mt-6">
          <Link
            href="/agent"
            className="text-sm font-medium text-slate-500 transition hover:text-indigo-600"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
