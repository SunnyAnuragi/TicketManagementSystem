import { TicketStatus } from "@/types/ticket";

type StatusBadgeProps = {
  status: TicketStatus | string;
  size?: "sm" | "md";
};

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const normalized = status.toUpperCase();

  let styles = "bg-slate-100 text-slate-700 border-slate-200";
  let dotColor = "bg-slate-400";
  let label = normalized;

  if (normalized === "OPEN") {
    styles = "bg-indigo-50 text-indigo-700 border-indigo-200/80";
    dotColor = "bg-indigo-500";
    label = "Open";
  } else if (normalized === "IN_PROGRESS") {
    styles = "bg-amber-50 text-amber-800 border-amber-200/80";
    dotColor = "bg-amber-500";
    label = "In Progress";
  } else if (normalized === "RESOLVED") {
    styles = "bg-emerald-50 text-emerald-800 border-emerald-200/80";
    dotColor = "bg-emerald-500";
    label = "Resolved";
  } else if (normalized === "CLOSED") {
    styles = "bg-slate-100 text-slate-600 border-slate-200";
    dotColor = "bg-slate-400";
    label = "Closed";
  }

  const sizeClasses =
    size === "sm" ? "px-2 py-0.5 text-xs gap-1.5" : "px-2.5 py-1 text-xs gap-1.5";

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border ${styles} ${sizeClasses}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      {label}
    </span>
  );
}
