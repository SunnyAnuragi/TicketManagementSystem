"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, LogOut, Search, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import api from "@/lib/axios";
import { clearStoredSession } from "@/lib/auth";

type NavbarProps = {
  role: "ADMIN" | "AGENT" | "CUSTOMER";
};

type CurrentUser = {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "AGENT" | "CUSTOMER";
};

export default function Navbar({ role }: NavbarProps) {
  const router = useRouter();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [open, setOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await api.get("/auth/me");
        setUser(response.data);
      } catch (error) {
        console.error("Failed to fetch current user:", error);

        // Clear invalid/expired session and redirect to login
        clearStoredSession();
        router.push("/login");
      }
    };

    fetchCurrentUser();
  }, [router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    clearStoredSession();
    router.push("/login");
  };

  const roleName =
    role === "ADMIN"
      ? "Administrator"
      : role === "AGENT"
        ? "Agent"
        : "Customer";

  const settingsPath =
    role === "ADMIN"
      ? "/admin/settings"
      : role === "AGENT"
        ? "/agent/settings"
        : "/user/settings";

  const initials = user?.name
    ? user.name
        .trim()
        .split(/\s+/)
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <header className="fixed left-64 right-0 top-0 z-30 h-16 border-b border-slate-200 bg-white">
      <div className="flex h-full items-center justify-between px-6">
        {/* Search */}
        <div className="relative w-96">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            placeholder="Search tickets..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <Bell size={19} />

            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-indigo-600" />
          </button>

          {/* User menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setOpen((previous) => !previous)}
              aria-expanded={open}
              aria-haspopup="menu"
              className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-slate-50"
            >
              {/* Avatar */}
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
                {initials}
              </div>

              {/* User information */}
              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold text-slate-900">
                  {user?.name || "Loading..."}
                </p>

                <p className="text-xs text-slate-500">{roleName}</p>
              </div>

              <ChevronDown
                size={16}
                className={`text-slate-400 transition-transform ${
                  open ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown */}
            {open && (
              <div
                role="menu"
                className="absolute right-0 top-12 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
              >
                {/* User information */}
                <div className="border-b border-slate-100 px-3 py-3">
                  <p className="text-sm font-semibold text-slate-900">
                    {user?.name || "User"}
                  </p>

                  <p className="mt-1 truncate text-xs text-slate-500">
                    {user?.email || ""}
                  </p>

                  <span className="mt-2 inline-block rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-600">
                    {roleName}
                  </span>
                </div>

                {/* Profile / Settings */}
                <Link
                  href={settingsPath}
                  onClick={() => setOpen(false)}
                  className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  <User size={17} className="text-slate-400" />
                  Profile
                </Link>

                {/* Logout */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
                >
                  <LogOut size={17} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
