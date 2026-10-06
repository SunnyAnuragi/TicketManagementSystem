import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

type DashboardLayoutProps = {
  children: React.ReactNode;
  role: "ADMIN" | "AGENT" | "CUSTOMER";
};

export default function DashboardLayout({
  children,
  role,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar role={role} />

      <Navbar role={role} />

      <main className="ml-64 pt-16">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
