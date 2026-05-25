import { STATUS_COLORS, STATUS_LABELS } from "shared/utils";

export default function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] ?? "bg-gray-100 text-gray-500";
  const label = STATUS_LABELS[status] ?? status;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}
