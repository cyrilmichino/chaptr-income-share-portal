import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "shared/api";
import { timeAgo } from "shared/utils";
import StatusBadge from "../components/StatusBadge";
import AdminLayout from "../components/AdminLayout";
import { RefreshCw, ChevronRight, Inbox, ArrowUpDown } from "lucide-react";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending Review" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

function matchesFilter(app, key) {
  if (key === "all") return true;
  if (key === "pending")
    return ["vetting_complete", "pending_decision", "pending_vetting"].includes(app.status);
  if (key === "approved")
    return ["approved", "contract_sent", "contract_signed"].includes(app.status);
  if (key === "rejected") return app.status === "rejected";
  return true;
}

function stepLabel(app) {
  const m = { draft: "Step 1", pending_vetting: "Step 2", vetting_complete: "Step 3", pending_decision: "Step 3", approved: "Step 4", contract_sent: "Step 4", contract_signed: "Step 4", rejected: "Step 4" };
  return m[app.status] ?? `Step ${app.step ?? 1}`;
}

function stepNum(app) {
  const m = { draft: 1, pending_vetting: 2, vetting_complete: 3, pending_decision: 3, approved: 4, contract_sent: 4, contract_signed: 4, rejected: 4 };
  return m[app.status] ?? 1;
}

export default function ApplicationsPage() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [lastRefresh, setLastRefresh] = useState(null);
  const pollRef = useRef(null);

  const fetchApps = async () => {
    try {
      const data = await api.getApplications();
      setApplications([...data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      setLastRefresh(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
    pollRef.current = setInterval(fetchApps, 5000);
    return () => clearInterval(pollRef.current);
  }, []);

  const filtered = applications.filter((a) => matchesFilter(a, activeFilter));
  const pendingCount = applications.filter((a) => matchesFilter(a, "pending")).length;

  return (
    <AdminLayout badge={{ "/": pendingCount }}>
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-chaptr-dark">Applications</h1>
          <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full">
            {applications.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-xs text-gray-400 hidden sm:block">
              Updated {timeAgo(lastRefresh.toISOString())}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <RefreshCw size={11} className="animate-spin" />
            Live
          </span>
        </div>
      </header>

      <div className="px-6 py-6 space-y-5">
        {/* Filter tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          {FILTERS.map((f) => {
            const count = f.key === "all" ? applications.length : applications.filter((a) => matchesFilter(a, f.key)).length;
            return (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeFilter === f.key ? "bg-white text-chaptr-dark shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {f.label}
                {count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                    activeFilter === f.key
                      ? f.key === "pending" ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-600"
                      : "bg-gray-200 text-gray-500"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center py-20">
            <RefreshCw className="animate-spin text-gray-300" size={24} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-20 gap-3 text-center px-6">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <Inbox className="text-gray-300" size={22} />
            </div>
            <p className="text-sm font-medium text-gray-500">
              {activeFilter === "all" ? "No applications yet." : `No ${FILTERS.find((f) => f.key === activeFilter)?.label.toLowerCase()} applications.`}
            </p>
            {activeFilter === "all" && (
              <p className="text-xs text-gray-400 max-w-xs">
                Share the student app link at{" "}
                <span className="font-mono bg-gray-100 px-1 rounded">localhost:5173</span> to get started.
              </p>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["Name", "Phone", "School", "Plan", "Applied", "Status", "Progress", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h && (
                        <span className="flex items-center gap-1">
                          {h}
                          {["Name", "Applied", "Status"].includes(h) && <ArrowUpDown size={10} className="text-gray-300" />}
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((app) => {
                  const sn = stepNum(app);
                  return (
                    <tr key={app.id} className="hover:bg-gray-50/70 transition-colors group">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-chaptr-purple/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-chaptr-purple">{app.full_name?.[0]?.toUpperCase() ?? "?"}</span>
                          </div>
                          <span className="font-medium text-chaptr-dark text-sm">{app.full_name ?? "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-500 whitespace-nowrap">{app.phone ?? "—"}</td>
                      <td className="px-4 py-3.5 text-sm text-gray-700">{app.school_name ?? "—"}</td>
                      <td className="px-4 py-3.5 max-w-[160px]">
                        <span className="text-xs text-gray-500 truncate block">{app.plan_name ?? "—"}</span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                        {app.created_at ? timeAgo(app.created_at) : "—"}
                      </td>
                      <td className="px-4 py-3.5"><StatusBadge status={app.status} /></td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4].map((s) => (
                            <div key={s} className={`h-1.5 w-5 rounded-full ${
                              s <= sn ? app.status === "rejected" ? "bg-red-300" : "bg-chaptr-primary" : "bg-gray-200"
                            }`} />
                          ))}
                          <span className="text-xs text-gray-400 ml-1">{stepLabel(app)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => navigate(`/applications/${app.id}`)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-chaptr-primary hover:text-chaptr-hover opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Review <ChevronRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
