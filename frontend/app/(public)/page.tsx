import Link from "next/link";
import Navbar from "../layout/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-2xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            Ticket Management System
          </h1>

          <p className="mt-4 text-lg text-gray-600">
            Manage support tickets, users, and agents efficiently.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/login"
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 hover:bg-gray-100"
            >
              Register
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
