"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon, ShieldCheck } from "lucide-react";
import api from "@/lib/axios";
import type { User as UserType } from "@/types/user";

type SettingsUser = Pick<UserType, "id" | "name" | "email" | "role">;

export default function CustomerSettingsPage() {
  const router = useRouter();

  const [user, setUser] = useState<SettingsUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const response = await api.get("/auth/me");

        if (response.data.role !== "CUSTOMER") {
          router.replace("/login");
          return;
        }

        setUser(response.data);
      } catch (error) {
        localStorage.removeItem("token");
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <div className="text-sm text-slate-500">Loading settings...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const initials = user.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Settings
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage your account information and preferences.
        </p>
      </div>

      {/* Profile Section */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-base font-semibold text-slate-900">Profile</h2>

          <p className="mt-1 text-sm text-slate-500">
            Your account information.
          </p>
        </div>

        <div className="p-6">
          {/* User Identity */}
          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-600">
              {initials}
            </div>

            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {user.name}
              </h3>

              <p className="mt-0.5 text-sm text-slate-500">{user.email}</p>

              <span className="mt-2 inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                Customer
              </span>
            </div>
          </div>

          {/* Account Details */}
          <div className="grid grid-cols-1 gap-6 pt-6 sm:grid-cols-2">
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
                Account ID
              </p>

              <p className="mt-2 text-sm font-medium text-slate-900">
                #{user.id}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Account Type
              </p>

              <p className="mt-2 text-sm font-medium text-slate-900">
                Customer
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-base font-semibold text-slate-900">Security</h2>

          <p className="mt-1 text-sm text-slate-500">
            Manage your current account session.
          </p>
        </div>

        <div className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-900">
                  Account authenticated
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Your current session is authenticated successfully.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Account Actions */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-base font-semibold text-slate-900">
            Account Actions
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Actions related to your current account.
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
              <UserIcon className="h-4 w-4 text-slate-600" />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-900">Sign out</p>

              <p className="mt-1 text-sm text-slate-500">
                End your current session on this device.
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </section>
    </div>
  );
}
