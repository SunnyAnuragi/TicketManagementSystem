import DashboardLayout from "@/components/layout/DashboardLayout";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout role="CUSTOMER">{children}</DashboardLayout>;
}
