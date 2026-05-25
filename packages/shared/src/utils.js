export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function formatCurrency(amount) {
  return `KES ${amount.toLocaleString("en-KE")}`;
}

export function formatDate(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function timeAgo(isoString) {
  if (!isoString) return "";
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export const STATUS_COLORS = {
  // Application pipeline
  draft: "bg-gray-100 text-gray-600",
  pending_vetting: "bg-yellow-100 text-yellow-700",
  vetting_complete: "bg-blue-100 text-blue-700",
  pending_decision: "bg-orange-100 text-orange-700",
  approved: "bg-green-100 text-green-700",
  contract_sent: "bg-green-100 text-green-700",
  contract_signed: "bg-green-200 text-green-800 font-semibold",
  rejected: "bg-red-100 text-red-700",
  // Contract phase
  still_learning: "bg-blue-100 text-blue-700",
  repayment: "bg-purple-100 text-purple-700",
  completed: "bg-gray-100 text-gray-500",
  // Invoice / report
  paid: "bg-green-100 text-green-700",
  waived: "bg-gray-100 text-gray-500",
  pending: "bg-orange-100 text-orange-700",
  overdue: "bg-red-100 text-red-700",
  // Settlement
  settled: "bg-green-100 text-green-700",
};

export const STATUS_LABELS = {
  draft: "Draft",
  pending_vetting: "Pending Vetting",
  vetting_complete: "Vetting Complete",
  pending_decision: "Pending Decision",
  approved: "Approved",
  contract_sent: "Contract Sent",
  contract_signed: "Contract Signed",
  rejected: "Rejected",
  still_learning: "Still Learning",
  repayment: "Repayment",
  completed: "Completed",
  paid: "Paid",
  waived: "Waived",
  pending: "Pending",
  overdue: "Overdue",
  settled: "Settled",
};
