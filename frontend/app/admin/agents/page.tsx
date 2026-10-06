"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/axios";

type Agent = {
  id: number;
  name: string;
  email: string;
  skills: string | null;
  experience: number | null;
  address: string | null;
};

export default function AdminAgentsPage() {
  const router = useRouter();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("");
  const [address, setAddress] = useState("");

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  useEffect(() => {
    const loadAgents = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const userResponse = await api.get("/auth/me");

        if (userResponse.data.role !== "ADMIN") {
          if (userResponse.data.role === "AGENT") {
            router.push("/agent");
          } else {
            router.push("/user");
          }

          return;
        }

        const response = await api.get("/admin/agents");

        setAgents(response.data.agents || []);
      } catch (err) {
        console.error("Failed to load agents:", err);
        setError("Failed to load agents.");
      } finally {
        setLoading(false);
      }
    };

    loadAgents();
  }, [router]);

  const filteredAgents = useMemo(() => {
    const value = search.toLowerCase().trim();

    if (!value) {
      return agents;
    }

    return agents.filter((agent) => {
      return (
        agent.name.toLowerCase().includes(value) ||
        agent.email.toLowerCase().includes(value) ||
        agent.skills?.toLowerCase().includes(value)
      );
    });
  }, [agents, search]);

  const resetForm = () => {
    setName("");
    setEmail("");
    setSkills("");
    setExperience("");
    setAddress("");
  };

  const closeCreateForm = () => {
    setShowCreateForm(false);
    setCreateError("");
    setCreateSuccess("");
    resetForm();
  };

  const handleCreateAgent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setCreateError("");
    setCreateSuccess("");

    if (!name.trim()) {
      setCreateError("Name is required.");
      return;
    }

    if (!email.trim()) {
      setCreateError("Email is required.");
      return;
    }

    if (!skills.trim()) {
      setCreateError("Skills are required.");
      return;
    }

    if (!experience.trim()) {
      setCreateError("Experience is required.");
      return;
    }

    if (!address.trim()) {
      setCreateError("Address is required.");
      return;
    }

    const experienceNumber = Number(experience);

    if (Number.isNaN(experienceNumber) || experienceNumber < 0) {
      setCreateError("Experience must be a valid number.");
      return;
    }

    try {
      setCreating(true);

      const response = await api.post("/admin/agents", {
        name: name.trim(),
        email: email.trim(),
        skills: skills.trim(),
        experience: experienceNumber,
        address: address.trim(),
      });

      const createdAgent = response.data.agent;

      setAgents((current) => [createdAgent, ...current]);

      const temporaryPassword = response.data.temporaryPassword;

      if (temporaryPassword) {
        setCreateSuccess(
          `Agent created successfully. Temporary password: ${temporaryPassword}`,
        );
      } else {
        setCreateSuccess("Agent created successfully.");
      }

      resetForm();
    } catch (err: unknown) {
      console.error("Failed to create agent:", err);

      const message = axios.isAxiosError<{ message?: string; error?: string }>(
        err,
      )
        ? err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to create agent."
        : "Failed to create agent.";

      setCreateError(message);
    } finally {
      setCreating(false);
    }
  };

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
      <div className="flex min-h-[70vh] items-center justify-center">
        <p className="text-sm text-slate-500">Loading agents...</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-600">
              Admin Workspace
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
              Agents
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage your support team and agent accounts.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowCreateForm(true);
              setCreateError("");
              setCreateSuccess("");
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            <span className="text-lg leading-none">+</span>
            Create Agent
          </button>
        </section>

        {/* Summary */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
            <p className="text-sm text-slate-500">Total Agents</p>

            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {agents.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
            <p className="text-sm text-slate-500">Showing</p>

            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {filteredAgents.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
            <p className="text-sm text-slate-500">Team Status</p>

            <div className="mt-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />

              <span className="text-sm font-medium text-slate-900">Active</span>
            </div>
          </div>
        </section>

        {/* Search */}
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search agents by name, email, or skills..."
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Agent Table */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">
              Support Team
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              All registered support agents.
            </p>
          </div>

          {filteredAgents.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <h3 className="text-base font-semibold text-slate-900">
                No agents found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                {search
                  ? "Try changing your search."
                  : "Create an agent to start building your support team."}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Agent
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Skills
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Experience
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Agent ID
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredAgents.map((agent) => (
                      <tr
                        key={agent.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-700">
                              {getInitials(agent.name)}
                            </div>

                            <div className="min-w-0">
                              <p className="font-medium text-slate-900">
                                {agent.name}
                              </p>

                              <p className="mt-0.5 truncate text-xs text-slate-500">
                                {agent.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="max-w-xs px-5 py-4">
                          <p className="truncate text-sm text-slate-600">
                            {agent.skills || "Not provided"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm text-slate-700">
                            {agent.experience !== null
                              ? `${agent.experience} ${
                                  agent.experience === 1 ? "year" : "years"
                                }`
                              : "Not provided"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-500">
                          #{agent.id}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="divide-y divide-slate-100 md:hidden">
                {filteredAgents.map((agent) => (
                  <div key={agent.id} className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-700">
                        {getInitials(agent.name)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-slate-900">
                              {agent.name}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-500">
                              {agent.email}
                            </p>
                          </div>

                          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-slate-400">Skills</p>

                            <p className="mt-1 text-sm text-slate-700">
                              {agent.skills || "Not provided"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-400">Experience</p>

                            <p className="mt-1 text-sm text-slate-700">
                              {agent.experience !== null
                                ? `${agent.experience} years`
                                : "Not provided"}
                            </p>
                          </div>
                        </div>

                        <p className="mt-4 text-xs text-slate-400">
                          Agent ID: #{agent.id}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Create Agent Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Create Agent
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add a new support agent to your team.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCreateForm}
                className="rounded-lg px-2 py-1 text-xl leading-none text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateAgent}>
              <div className="space-y-5 px-6 py-6">
                {createError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-sm text-red-700">{createError}</p>
                  </div>
                )}

                {createSuccess && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <p className="text-sm text-emerald-700">{createSuccess}</p>
                  </div>
                )}

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Full Name
                    </label>

                    <input
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Rahul Sharma"
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Email
                    </label>

                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="rahul@example.com"
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Skills
                    </label>

                    <input
                      type="text"
                      value={skills}
                      onChange={(event) => setSkills(event.target.value)}
                      placeholder="React, Node.js, MySQL"
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Experience
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={experience}
                      onChange={(event) => setExperience(event.target.value)}
                      placeholder="Years"
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Address
                  </label>

                  <textarea
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    rows={3}
                    placeholder="Enter agent address"
                    className="w-full resize-none rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
                <button
                  type="button"
                  onClick={closeCreateForm}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Agent"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
