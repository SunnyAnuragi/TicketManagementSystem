"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Users, Mail, UserRound } from "lucide-react";
import api from "@/lib/axios";

type Customer = {
  id: number;
  name: string;
  email: string;
  role: "CUSTOMER";
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCustomers = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      try {
        const meResponse = await api.get("/auth/me");

        if (meResponse.data.role !== "ADMIN") {
          window.location.href = "/login";
          return;
        }

        const response = await api.get("/users");

        const users = response.data.users ?? response.data;

        const customerUsers = users.filter(
          (user: Customer) => user.role === "CUSTOMER",
        );

        setCustomers(customerUsers);
      } catch (err) {
        console.error(err);
        setError("Unable to load customers. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return customers;
    }

    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query),
    );
  }, [customers, search]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="flex min-h-[400px] items-center justify-center">
          <p className="text-sm text-slate-500">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-600">Administration</p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            Customers
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            View and manage customer accounts across the support platform.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <Users className="h-4 w-4 text-slate-400" />

          <span className="text-sm font-medium text-slate-700">
            {customers.length}{" "}
            {customers.length === 1 ? "Customer" : "Customers"}
          </span>
        </div>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Customers
              </p>

              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {customers.length}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
              <Users className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Showing</p>

              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {filteredCustomers.length}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
              <UserRound className="h-5 w-5 text-slate-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Workspace */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {/* Toolbar */}
        <div className="border-b border-slate-200 p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Customer Directory
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Search customer accounts by name or email.
              </p>
            </div>

            <div className="relative w-full lg:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search customers..."
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="border-b border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Desktop Table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-left">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Customer
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Email
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Account ID
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Role
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  className="transition hover:bg-slate-50/70"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600">
                        {getInitials(customer.name)}
                      </div>

                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {customer.name}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-400">
                          Customer account
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail className="h-4 w-4 text-slate-400" />
                      {customer.email}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span className="text-sm font-medium text-slate-700">
                      #{customer.id}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      CUSTOMER
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="divide-y divide-slate-100 md:hidden">
          {filteredCustomers.map((customer) => (
            <div key={customer.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600">
                    {getInitials(customer.name)}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {customer.name}
                    </p>

                    <p className="mt-1 break-all text-xs text-slate-500">
                      {customer.email}
                    </p>
                  </div>
                </div>

                <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                  CUSTOMER
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-xs text-slate-400">Account ID</span>

                <span className="text-sm font-medium text-slate-700">
                  #{customer.id}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredCustomers.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <Users className="h-5 w-5 text-slate-400" />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-900">
              No customers found
            </h3>

            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {search
                ? "Try adjusting your search to find another customer."
                : "There are currently no customer accounts in the system."}
            </p>
          </div>
        )}

        {/* Footer */}
        {filteredCustomers.length > 0 && (
          <div className="border-t border-slate-200 bg-slate-50/50 px-5 py-3">
            <p className="text-xs text-slate-500">
              Showing {filteredCustomers.length} of {customers.length} customers
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
