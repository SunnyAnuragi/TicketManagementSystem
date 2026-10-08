import Link from "next/link";
import Navbar from "../layout/Navbar";

const features = [
  {
    icon: "🎫",
    title: "Smart Ticket Management",
    description:
      "Create, track, update, and resolve support tickets from one centralized workspace.",
  },
  {
    icon: "👥",
    title: "Role-Based Workflows",
    description:
      "Dedicated workflows for customers, agents, and administrators with secure access control.",
  },
  {
    icon: "🔐",
    title: "Secure Authentication",
    description:
      "JWT authentication, protected routes, and role-based authorization keep your workspace secure.",
  },
  {
    icon: "🔎",
    title: "Search & Filtering",
    description:
      "Find the right ticket quickly using search, status, priority, and pagination.",
  },
  {
    icon: "📜",
    title: "Ticket History",
    description:
      "Keep track of important ticket changes with a clear audit history.",
  },
  {
    icon: "🖼️",
    title: "Image Attachments",
    description:
      "Attach support images directly to tickets and keep relevant information together.",
  },
];

const roles = [
  {
    icon: "👤",
    title: "Customer",
    description:
      "Create support tickets, track progress, communicate with agents, and attach relevant images.",
  },
  {
    icon: "🧑‍💻",
    title: "Agent",
    description:
      "Work on assigned tickets, communicate with customers, update status, and resolve issues.",
  },
  {
    icon: "🛡️",
    title: "Admin",
    description:
      "Manage agents, assign tickets, monitor the system, and oversee the complete support workflow.",
  },
];

export default function Home() {
  return (
    <>
      <Navbar />

      <main className="overflow-hidden bg-slate-50 text-slate-900">
        {/* Hero */}
        <section className="relative">
          <div className="absolute inset-x-0 top-0 -z-10 h-[600px] bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.14),_transparent_45%),radial-gradient(circle_at_top_left,_rgba(14,165,233,0.10),_transparent_40%)]" />

          <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 pb-24 pt-20 lg:grid-cols-2 lg:px-8 lg:pb-32 lg:pt-28">
            {/* Hero content */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/80 px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                Modern support ticket management
              </div>

              <h1 className="mt-7 max-w-3xl text-5xl font-bold tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
                Manage support.
                <span className="block text-indigo-600">Resolve faster.</span>
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
                A modern ticket management platform that connects customers,
                support agents, and administrators in one streamlined workspace.
              </p>

              <div className="mt-9 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/register"
                  className="rounded-xl bg-indigo-600 px-7 py-3.5 text-center font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700"
                >
                  Get Started
                  <span className="ml-2">→</span>
                </Link>

                <Link
                  href="/login"
                  className="rounded-xl border border-slate-300 bg-white px-7 py-3.5 text-center font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50"
                >
                  Sign In
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500">
                <span>✓ Role-based access</span>
                <span>✓ Secure authentication</span>
                <span>✓ Ticket history</span>
                <span>✓ Cloud attachments</span>
              </div>
            </div>

            {/* Dashboard preview */}
            <div className="relative">
              <div className="absolute -inset-5 rounded-[2rem] bg-indigo-200/30 blur-3xl" />

              <div className="relative rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-300/40">
                {/* Fake browser/dashboard header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-3 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                    </div>

                    <span className="ml-2 text-xs font-medium text-slate-400">
                      TMS Dashboard
                    </span>
                  </div>

                  <div className="h-7 w-7 rounded-full bg-indigo-100" />
                </div>

                <div className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                        Overview
                      </p>
                      <h2 className="mt-1 text-xl font-bold text-slate-900">
                        Ticket Dashboard
                      </h2>
                    </div>

                    <span className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-600">
                      Live
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Open</p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">
                        24
                      </p>
                    </div>

                    <div className="rounded-xl bg-indigo-50 p-3">
                      <p className="text-xs text-indigo-600">In Progress</p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">
                        12
                      </p>
                    </div>

                    <div className="rounded-xl bg-emerald-50 p-3">
                      <p className="text-xs text-emerald-600">Resolved</p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">
                        48
                      </p>
                    </div>
                  </div>

                  {/* Ticket list */}
                  <div className="mt-5 space-y-3">
                    <div className="rounded-xl border border-slate-100 p-4 transition hover:border-indigo-200">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            Unable to access account
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Ticket #1042 · Customer Support
                          </p>
                        </div>

                        <span className="rounded-md bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-600">
                          HIGH
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs font-medium text-indigo-600">
                          IN PROGRESS
                        </span>

                        <span className="text-xs text-slate-400">
                          12 min ago
                        </span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-100 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            Payment confirmation issue
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Ticket #1041 · Billing
                          </p>
                        </div>

                        <span className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-600">
                          RESOLVED
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-y border-slate-200 bg-white py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
                Everything in one place
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Everything you need to manage support
              </h2>

              <p className="mt-4 text-lg leading-8 text-slate-500">
                Built around a simple workflow that helps teams create,
                organize, communicate, and resolve support issues efficiently.
              </p>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-slate-200 bg-slate-50/60 p-6 transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:bg-white hover:shadow-xl hover:shadow-slate-200/60"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-xl">
                    {feature.icon}
                  </div>

                  <h3 className="mt-5 text-lg font-semibold text-slate-900">
                    {feature.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-slate-950 py-24 text-white">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-widest text-indigo-300">
                Simple workflow
              </p>

              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                From issue to resolution
              </h2>

              <p className="mt-4 text-lg leading-8 text-slate-400">
                Keep every support request moving through a clear and trackable
                workflow.
              </p>
            </div>

            <div className="mt-14 grid gap-8 md:grid-cols-4">
              {[
                {
                  number: "01",
                  title: "Create",
                  description: "A customer submits a support ticket.",
                },
                {
                  number: "02",
                  title: "Assign",
                  description:
                    "An administrator assigns the ticket to an agent.",
                },
                {
                  number: "03",
                  title: "Resolve",
                  description:
                    "The agent works on the issue and updates its status.",
                },
                {
                  number: "04",
                  title: "Track",
                  description:
                    "Everyone with access can follow the ticket history.",
                },
              ].map((step) => (
                <div key={step.number} className="relative">
                  <p className="text-sm font-bold text-indigo-400">
                    {step.number}
                  </p>

                  <h3 className="mt-4 text-xl font-semibold">{step.title}</h3>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Roles */}
        <section className="bg-slate-50 py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
                Built for every role
              </p>

              <h2 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">
                One platform. Three workflows.
              </h2>

              <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
                Each role gets the tools and permissions needed to keep support
                operations organized.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {roles.map((role) => (
                <div
                  key={role.title}
                  className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-xl">
                    {role.icon}
                  </div>

                  <h3 className="mt-5 text-xl font-semibold text-slate-900">
                    {role.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    {role.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-white px-6 py-24">
          <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-indigo-600 px-8 py-14 text-center shadow-2xl shadow-indigo-200 sm:px-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-200">
              Get started
            </p>

            <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
              Ready to streamline your support workflow?
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-indigo-100">
              Create your account and start managing support tickets through one
              organized platform.
            </p>

            <div className="mt-8">
              <Link
                href="/register"
                className="inline-flex rounded-xl bg-white px-7 py-3.5 font-semibold text-indigo-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-50"
              >
                Get Started
                <span className="ml-2">→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <div>
              <p className="font-semibold text-slate-900">
                🎫 Ticket Management System
              </p>
              <p className="mt-1">
                A modern platform for organized support operations.
              </p>
            </div>

            <p>© 2026 Ticket Management System</p>
          </div>
        </footer>
      </main>
    </>
  );
}
