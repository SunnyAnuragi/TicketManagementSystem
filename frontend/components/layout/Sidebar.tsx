"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Ticket,
  Users,
  UserCog,
  Plus,
  Settings,
} from "lucide-react";

type SidebarProps = {
  role: "ADMIN" | "AGENT" | "CUSTOMER";
};

type MenuItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const menuItems: Record<"ADMIN" | "AGENT" | "CUSTOMER", MenuItem[]> = {
    ADMIN: [
      {
        label: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
      },
      {
        label: "All Tickets",
        href: "/admin/tickets",
        icon: Ticket,
      },
      {
        label: "Agents",
        href: "/admin/agents",
        icon: UserCog,
      },
      {
        label: "Customers",
        href: "/admin/users",
        icon: Users,
      },
    ],

    AGENT: [
      {
        label: "Dashboard",
        href: "/agent",
        icon: LayoutDashboard,
      },
      {
        label: "Assigned Tickets",
        href: "/agent/tickets",
        icon: Ticket,
      },
    ],

    CUSTOMER: [
      {
        label: "Dashboard",
        href: "/user",
        icon: LayoutDashboard,
      },
      {
        label: "My Tickets",
        href: "/user/tickets",
        icon: Ticket,
      },
    ],
  };

  const items = menuItems[role];

  const dashboardPath =
    role === "ADMIN" ? "/admin" : role === "AGENT" ? "/agent" : "/user";

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-slate-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-slate-200 px-6">
        <Link href={dashboardPath} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            T
          </div>

          <span className="text-xl font-bold tracking-tight text-slate-900">
            TMS
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Workspace
        </p>

        <div className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;

            const isActive =
              item.href === dashboardPath
                ? pathname === item.href
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon
                  size={19}
                  strokeWidth={isActive ? 2.3 : 2}
                  className={
                    isActive
                      ? "text-indigo-600"
                      : "text-slate-400 group-hover:text-slate-600"
                  }
                />

                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Customer create ticket */}
        {role === "CUSTOMER" && (
          <div className="mt-6">
            <Link
              href="/user/tickets/create"
              className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              <Plus size={18} />
              Create Ticket
            </Link>
          </div>
        )}
      </nav>

      {/* Bottom navigation */}
      <div className="border-t border-slate-200 p-3">
        <Link
          href={`${dashboardPath}/settings`}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
        >
          <Settings size={19} className="text-slate-400" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
