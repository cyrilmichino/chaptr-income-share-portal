import { useState, useEffect } from "react";
import { api } from "shared/api";
import { formatDate } from "shared/utils";
import StatusBadge from "../components/StatusBadge";
import AdminLayout from "../components/AdminLayout";
import { RefreshCw, Banknote, Clock, CheckCircle2, Building2 } from "lucide-react";

function formatKES(n) {
  return `KES ${Number(n ?? 0).toLocaleString("en-KE")}`;
}

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSettlements().then((data) => {
      setSettlements(data);
      setLoading(false);
    });
  }, []);

  const settled = settlements.filter((s) => s.status === "settled");
  const pending = settlements.filter((s) => s.status === "pending");
  const totalDisbursed = settled.reduce((sum, s) => sum + (s.amount_disbursed_kes ?? 0), 0);
  const totalFees = settled.reduce((sum, s) => sum + (s.chaptr_fee_kes ?? 0), 0);
  const totalPending = pending.reduce((sum, s) => sum + (s.total_collected_kes ?? 0), 0);

  // Group by school for running totals
  const bySchool = {};
  settlements.forEach((s) => {
    if (!bySchool[s.school_name]) bySchool[s.school_name] = { disbursed: 0, collected: 0 };
    bySchool[s.school_name].collected += s.total_collected_kes ?? 0;
    bySchool[s.school_name].disbursed += s.amount_disbursed_kes ?? 0;
  });

  return (
    <AdminLayout>
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-chaptr-dark">Settlements</h1>
          <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full">
            {settlements.length} total
          </span>
        </div>
      </header>

      <div className="px-6 py-6 space-y-5">
        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: CheckCircle2, label: "Total Disbursed", value: formatKES(totalDisbursed), color: "text-chaptr-primary", bg: "bg-green-50" },
            { icon: Banknote, label: "Chaptr Fees Earned", value: formatKES(totalFees), color: "text-chaptr-purple", bg: "bg-purple-50" },
            { icon: Clock, label: "Pending Settlement", value: formatKES(totalPending), color: "text-orange-600", bg: "bg-orange-50" },
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

        {/* Per-school totals */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <Building2 className="text-gray-400" size={14} />
            <p className="text-xs font-semibold text-gray-700">Running Totals by School</p>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-2 font-semibold text-gray-500">School</th>
                <th className="text-right px-4 py-2 font-semibold text-gray-500">Total Collected</th>
                <th className="text-right px-4 py-2 font-semibold text-gray-500">Total Disbursed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {Object.entries(bySchool).map(([school, totals]) => (
                <tr key={school} className="hover:bg-gray-50/50">
                  <td className="px-4 py-2.5 font-medium text-gray-700">{school}</td>
                  <td className="px-4 py-2.5 text-right text-gray-500">{formatKES(totals.collected)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-chaptr-primary">{formatKES(totals.disbursed)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Settlements table */}
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center py-20">
            <RefreshCw className="animate-spin text-gray-300" size={24} />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["Period", "School", "Collected", "Chaptr Fee (10%)", "Disbursed", "Reference", "Status", "Settled At"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {settlements.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3.5 font-medium text-gray-700 whitespace-nowrap">{s.period}</td>
                    <td className="px-4 py-3.5 text-gray-700">{s.school_name}</td>
                    <td className="px-4 py-3.5 text-gray-700 whitespace-nowrap">{formatKES(s.total_collected_kes)}</td>
                    <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">{formatKES(s.chaptr_fee_kes)}</td>
                    <td className="px-4 py-3.5 font-semibold text-chaptr-primary whitespace-nowrap">
                      {s.amount_disbursed_kes ? formatKES(s.amount_disbursed_kes) : "—"}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-gray-400">
                      {s.reference ?? "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                      {s.settled_at ? formatDate(s.settled_at) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50">
                  <td className="px-4 py-2.5 font-semibold text-gray-700" colSpan={4}>Total disbursed (settled only)</td>
                  <td className="px-4 py-2.5 font-bold text-chaptr-primary">{formatKES(totalDisbursed)}</td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
