import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "shared/api";
import { formatDate, timeAgo } from "shared/utils";
import StatusBadge from "../components/StatusBadge";
import AdminLayout from "../components/AdminLayout";
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  BookOpen,
  Banknote,
  Receipt,
} from "lucide-react";

function formatKES(n) {
  return `KES ${Number(n ?? 0).toLocaleString("en-KE")}`;
}

function capProgress(contract) {
  const plan = contract.plan_details ?? {};
  const cap = (plan.tuition_amount ?? 0) * (plan.payment_cap_multiplier ?? 1);
  if (!cap) return 0;
  const paid = (contract.payments ?? [])
    .filter((p) => p.amount_kes > 0)
    .reduce((s, p) => s + p.amount_kes, 0);
  return Math.min(100, (paid / cap) * 100);
}

function totalPaid(contract) {
  return (contract.payments ?? []).reduce((s, p) => s + (p.amount_kes ?? 0), 0);
}

const PHASE_FILTERS = [
  { key: "all", label: "All" },
  { key: "still_learning", label: "Still Learning" },
  { key: "repayment", label: "Repayment" },
];

// ─── Repayment detail drawer ──────────────────────────────────────────────────
function RepaymentDrawer({ contract }) {
  const plan = contract.plan_details ?? {};
  const cap = (plan.tuition_amount ?? 0) * (plan.payment_cap_multiplier ?? 1);
  const paid = totalPaid(contract);
  const pct = cap ? Math.min(100, (paid / cap) * 100) : 0;
  const invoices = contract.invoices ?? [];
  const payments = contract.payments ?? [];

  const receiptMap = {};
  payments.forEach((p) => { receiptMap[p.invoice_id] = p; });

  return (
    <div className="bg-gray-50 border-t border-gray-100 px-5 py-5 space-y-5">
      {/* Cap progress */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Repayment Progress
          </p>
          <span className="text-xs font-bold text-gray-700">
            {formatKES(paid)} / {formatKES(cap)}
          </span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              pct >= 80 ? "bg-chaptr-orange" : "bg-chaptr-primary"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>{pct.toFixed(1)}% of cap</span>
          <span>{formatKES(cap - paid)} remaining</span>
        </div>
        {pct >= 75 && (
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
            <AlertTriangle className="text-chaptr-orange flex-shrink-0" size={13} />
            <p className="text-xs text-orange-700 font-medium">
              Approaching payment cap — {(100 - pct).toFixed(1)}% remaining
            </p>
          </div>
        )}
      </div>

      {/* Invoice table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <Receipt className="text-gray-400" size={14} />
          <p className="text-xs font-semibold text-gray-700">Invoices & Payments</p>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-2 font-semibold text-gray-500">Period</th>
              <th className="text-left px-4 py-2 font-semibold text-gray-500">Income</th>
              <th className="text-right px-4 py-2 font-semibold text-gray-500">Invoice</th>
              <th className="text-left px-4 py-2 font-semibold text-gray-500">Status</th>
              <th className="text-left px-4 py-2 font-semibold text-gray-500">Receipt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {invoices.map((inv) => {
              const pay = receiptMap[inv.id];
              return (
                <tr key={inv.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-2.5 font-medium text-gray-700">{inv.period}</td>
                  <td className="px-4 py-2.5 text-gray-500">
                    {inv.gross_income_kes > 0 ? formatKES(inv.gross_income_kes) : (
                      <span className="text-gray-300 italic">Unemployed</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-gray-800">
                    {inv.amount_kes > 0 ? formatKES(inv.amount_kes) : "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="px-4 py-2.5 font-mono text-gray-400">
                    {pay?.mpesa_receipt ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200 bg-gray-50">
              <td className="px-4 py-2.5 font-semibold text-gray-700" colSpan={2}>Total paid</td>
              <td className="px-4 py-2.5 text-right font-bold text-chaptr-primary">{formatKES(paid)}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ─── Contract row ─────────────────────────────────────────────────────────────
function ContractRow({ contract }) {
  const [expanded, setExpanded] = useState(false);
  const isRepayment = contract.phase === "repayment";
  const isOverdue = !contract.current_report_submitted && contract.phase === "still_learning";
  const progress = isRepayment ? capProgress(contract) : null;

  return (
    <>
      <tr className={`border-b border-gray-100 hover:bg-gray-50/60 transition-colors ${expanded ? "bg-blue-50/30" : ""}`}>
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-chaptr-purple/10 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-chaptr-purple">{contract.full_name?.[0]?.toUpperCase()}</span>
            </div>
            <div>
              <p className="font-medium text-chaptr-dark text-sm">{contract.full_name}</p>
              <p className="text-xs text-gray-400">{contract.county}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3.5">
          <p className="text-sm text-gray-700">{contract.school_name}</p>
          <p className="text-xs text-gray-400 truncate max-w-[140px]">{contract.plan_name}</p>
        </td>
        <td className="px-4 py-3.5">
          <StatusBadge status={contract.phase} />
        </td>
        <td className="px-4 py-3.5 text-xs text-gray-500">
          {contract.enrolled_at ? formatDate(contract.enrolled_at) : "—"}
        </td>
        <td className="px-4 py-3.5">
          {isRepayment ? (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>{progress?.toFixed(0)}% of cap</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden w-24">
                <div
                  className={`h-full rounded-full ${progress >= 75 ? "bg-chaptr-orange" : "bg-chaptr-primary"}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              {contract.current_report_submitted ? (
                <span className="flex items-center gap-1 text-xs text-chaptr-primary">
                  <CheckCircle2 size={12} />
                  Submitted
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-chaptr-orange font-medium">
                  <AlertTriangle size={12} />
                  Overdue
                </span>
              )}
            </div>
          )}
        </td>
        <td className="px-4 py-3.5">
          {isRepayment && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-chaptr-primary hover:text-chaptr-hover transition-colors"
            >
              {expanded ? "Collapse" : "View"}
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}
        </td>
      </tr>
      {expanded && isRepayment && (
        <tr>
          <td colSpan={6} className="p-0">
            <RepaymentDrawer contract={contract} />
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ContractsPage() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    api.getContracts().then((data) => {
      setContracts(data);
      setLoading(false);
    });
  }, []);

  const filtered = contracts.filter(
    (c) => filter === "all" || c.phase === filter
  );

  const stillLearning = contracts.filter((c) => c.phase === "still_learning");
  const repayment = contracts.filter((c) => c.phase === "repayment");
  const overdueCount = stillLearning.filter((c) => !c.current_report_submitted).length;
  const totalCollected = repayment.reduce((s, c) => s + totalPaid(c), 0);

  return (
    <AdminLayout>
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-chaptr-dark">Contracts</h1>
          <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full">
            {contracts.length} active
          </span>
          {overdueCount > 0 && (
            <span className="flex items-center gap-1 bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              <AlertTriangle size={10} />
              {overdueCount} overdue report{overdueCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </header>

      <div className="px-6 py-6 space-y-5">
        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: BookOpen, label: "Still Learning", value: stillLearning.length, color: "text-blue-600", bg: "bg-blue-50" },
            { icon: TrendingUp, label: "In Repayment", value: repayment.length, color: "text-purple-600", bg: "bg-purple-50" },
            { icon: AlertTriangle, label: "Overdue Reports", value: overdueCount, color: "text-orange-600", bg: "bg-orange-50" },
            { icon: Banknote, label: "Total Collected", value: formatKES(totalCollected), color: "text-chaptr-primary", bg: "bg-green-50" },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <Icon className={color} size={17} />
              </div>
              <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className={`text-sm font-bold ${color}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          {PHASE_FILTERS.map((f) => {
            const count = f.key === "all" ? contracts.length : contracts.filter((c) => c.phase === f.key).length;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                  filter === f.key ? "bg-white text-chaptr-dark shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {f.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === f.key ? "bg-gray-100 text-gray-600" : "bg-gray-200 text-gray-500"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center py-20">
            <RefreshCw className="animate-spin text-gray-300" size={24} />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["Student", "School & Plan", "Phase", "Enrolled", "Status / Progress", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <ContractRow key={c.id} contract={c} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
