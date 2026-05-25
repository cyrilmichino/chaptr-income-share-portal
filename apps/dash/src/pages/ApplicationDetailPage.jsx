import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "shared/api";
import { timeAgo, formatDate } from "shared/utils";
import StatusBadge from "../components/StatusBadge";
import AdminLayout from "../components/AdminLayout";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Loader2,
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  GraduationCap,
  Calendar,
  CreditCard,
  FileCheck,
  BookOpen,
  PenLine,
  ChevronDown,
  AlertCircle,
  CheckCheck,
  Clock,
} from "lucide-react";

function formatKES(n) {
  if (!n) return "—";
  return `KES ${Number(n).toLocaleString("en-KE")}`;
}

function calcAge(dob) {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-sm font-medium transition-all ${
        type === "success"
          ? "bg-chaptr-primary text-white"
          : "bg-red-500 text-white"
      }`}
    >
      {type === "success" ? (
        <CheckCheck size={16} />
      ) : (
        <AlertCircle size={16} />
      )}
      {message}
    </div>
  );
}

// ─── Info row ─────────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <Icon className="text-gray-300 flex-shrink-0 mt-0.5" size={14} />
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-800 mt-0.5 break-words">
          {value ?? "—"}
        </p>
      </div>
    </div>
  );
}

// ─── Step tracker ─────────────────────────────────────────────────────────────
function StepTracker({ app }) {
  const statusToStep = {
    draft: 1,
    pending_vetting: 2,
    vetting_complete: 3,
    pending_decision: 3,
    approved: 4,
    contract_sent: 4,
    contract_signed: 4,
    rejected: 4,
  };
  const reached = statusToStep[app?.status] ?? 1;

  const steps = [
    {
      num: 1,
      label: "Basic Info",
      details: app?.full_name
        ? [`${app.full_name}`, `${app.school_name}`, `${app.plan_name}`]
        : [],
    },
    {
      num: 2,
      label: "Credit Vetting",
      details:
        reached >= 2
          ? ["ID uploaded", "Statements uploaded", "Consent signed"]
          : [],
    },
    {
      num: 3,
      label: "ISA Education",
      details:
        reached >= 3
          ? [
              app?.quiz_passed
                ? `Quiz passed (${app.quiz_score ?? "—"}/5)`
                : "Quiz not yet completed",
            ]
          : [],
    },
    {
      num: 4,
      label: "Decision",
      details:
        reached >= 4
          ? [
              app?.decided_at
                ? `Decision: ${app.status} on ${formatDate(app.decided_at)}`
                : app?.status === "vetting_complete"
                ? "Awaiting admin decision"
                : "",
            ].filter(Boolean)
          : [],
    },
  ];

  return (
    <div className="space-y-3">
      {steps.map((step) => {
        const done = step.num < reached || (step.num === reached && ["approved","contract_sent","contract_signed","rejected"].includes(app?.status));
        const active = step.num === reached;
        const pending = step.num > reached;

        return (
          <div key={step.num} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  done
                    ? "bg-chaptr-primary text-white"
                    : active
                    ? "bg-chaptr-primary/20 text-chaptr-primary ring-2 ring-chaptr-primary"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {done ? <CheckCircle2 size={14} /> : step.num}
              </div>
              {step.num < 4 && (
                <div
                  className={`w-0.5 h-6 mt-0.5 ${
                    done ? "bg-chaptr-primary" : "bg-gray-100"
                  }`}
                />
              )}
            </div>
            <div className="pb-2 pt-0.5 min-w-0">
              <p
                className={`text-sm font-semibold ${
                  pending ? "text-gray-300" : "text-gray-800"
                }`}
              >
                {step.label}
              </p>
              {step.details.map((d, i) => (
                <p key={i} className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  {done && <CheckCircle2 className="text-chaptr-primary flex-shrink-0" size={10} />}
                  {d}
                </p>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Terms summary (reused from student app) ─────────────────────────────────
function TermsCard({ app }) {
  const plan = app?.plan_details ?? {};
  const isISA = app?.plan_type === "isa";
  const rows = isISA
    ? [
        { label: "Tuition", value: formatKES(plan.tuition_amount) },
        { label: "Income Share", value: `${(plan.income_share_pct * 100).toFixed(0)}%` },
        { label: "Cap", value: `${plan.payment_cap_multiplier}x — ${formatKES(plan.tuition_amount * plan.payment_cap_multiplier)}` },
        { label: "Term", value: `${plan.repayment_term_months} months` },
        { label: "Threshold", value: formatKES(plan.income_threshold_kes) + "/mo" },
        { label: "Grace", value: `${plan.grace_period_months} months` },
      ]
    : [
        { label: "Tuition", value: formatKES(plan.tuition_amount) },
        { label: "Installments", value: `${plan.installment_count} × ${formatKES(plan.installment_amount_kes)}` },
        { label: "Late fee", value: formatKES(plan.late_fee_kes) },
      ];

  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 bg-white border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {isISA ? "ISA" : "Lipa Mdogo Mdogo"} Terms
        </p>
      </div>
      <div className="divide-y divide-gray-100">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex justify-between px-4 py-2">
            <span className="text-xs text-gray-400">{label}</span>
            <span className="text-xs font-semibold text-gray-800 text-right max-w-[55%]">
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Decision panel ───────────────────────────────────────────────────────────
const REJECTION_REASONS = [
  "Does not meet income requirements",
  "ID verification failed",
  "Incomplete documents",
  "Duplicate application",
  "Other",
];

function DecisionPanel({ app, onDecision }) {
  const canDecide = ["vetting_complete", "pending_decision"].includes(
    app?.status
  );
  const alreadyDecided = ["approved", "contract_sent", "contract_signed"].includes(app?.status);
  const isRejected = app?.status === "rejected";

  const [mode, setMode] = useState(null); // null | 'reject' | 'more_info'
  const [rejectReason, setRejectReason] = useState("");
  const [rejectNotes, setRejectNotes] = useState("");
  const [moreInfoMsg, setMoreInfoMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await api.updateApplication(app.id, {
        status: "approved",
        decided_at: new Date().toISOString(),
        decided_by: "Admin",
      });
      onDecision("approved");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason) return;
    setLoading(true);
    try {
      await api.updateApplication(app.id, {
        status: "rejected",
        rejection_reason: rejectNotes
          ? `${rejectReason}: ${rejectNotes}`
          : rejectReason,
        decided_at: new Date().toISOString(),
        decided_by: "Admin",
      });
      onDecision("rejected");
    } finally {
      setLoading(false);
    }
  };

  const handleMoreInfo = async () => {
    if (!moreInfoMsg.trim()) return;
    setLoading(true);
    try {
      await api.updateApplication(app.id, {
        status: "pending_decision",
        more_info_request: moreInfoMsg,
        more_info_requested_at: new Date().toISOString(),
      });
      onDecision("more_info");
    } finally {
      setLoading(false);
    }
  };

  if (alreadyDecided) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
        <CheckCircle2 className="text-chaptr-primary flex-shrink-0" size={20} />
        <div>
          <p className="text-sm font-semibold text-green-800">Application approved</p>
          <p className="text-xs text-green-600 mt-0.5">
            Decided {app.decided_at ? timeAgo(app.decided_at) : ""} by {app.decided_by ?? "Admin"}
          </p>
        </div>
      </div>
    );
  }

  if (isRejected) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
        <XCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
        <div>
          <p className="text-sm font-semibold text-red-800">Application rejected</p>
          {app.rejection_reason && (
            <p className="text-xs text-red-600 mt-0.5">{app.rejection_reason}</p>
          )}
        </div>
      </div>
    );
  }

  if (!canDecide) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 flex flex-col items-center text-center gap-2">
        <Clock className="text-gray-300" size={22} />
        <p className="text-xs text-gray-400 leading-relaxed">
          Decision panel unlocks when the student completes the education module
          (status: <span className="font-mono">vetting_complete</span>).
        </p>
        <p className="text-xs text-gray-300">
          Current:{" "}
          <span className="font-mono font-medium">{app?.status}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        Make a Decision
      </p>

      {/* Approve */}
      {mode !== "reject" && mode !== "more_info" && (
        <button
          onClick={handleApprove}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-chaptr-primary hover:bg-chaptr-hover disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-md shadow-green-100"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <CheckCircle2 size={16} />
          )}
          Approve Application
        </button>
      )}

      {/* Reject */}
      {mode !== "more_info" && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setMode(mode === "reject" ? null : "reject")}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <XCircle size={15} />
              Reject Application
            </span>
            <ChevronDown
              size={14}
              className={`transition-transform ${mode === "reject" ? "rotate-180" : ""}`}
            />
          </button>
          {mode === "reject" && (
            <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
              <div className="relative">
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 appearance-none"
                >
                  <option value="">Select reason...</option>
                  {REJECTION_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
              <textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder="Additional notes (optional)..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setMode(null)}
                  className="flex-1 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-500 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectReason || loading}
                  className="flex-1 py-2 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={13} />
                  ) : (
                    <XCircle size={13} />
                  )}
                  Confirm Rejection
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Request More Info */}
      {mode !== "reject" && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setMode(mode === "more_info" ? null : "more_info")}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-chaptr-orange hover:bg-orange-50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <MessageSquare size={15} />
              Request More Info
            </span>
            <ChevronDown
              size={14}
              className={`transition-transform ${mode === "more_info" ? "rotate-180" : ""}`}
            />
          </button>
          {mode === "more_info" && (
            <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
              <textarea
                value={moreInfoMsg}
                onChange={(e) => setMoreInfoMsg(e.target.value)}
                placeholder="Describe what additional information is required..."
                rows={4}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-chaptr-orange resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setMode(null)}
                  className="flex-1 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-500 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMoreInfo}
                  disabled={!moreInfoMsg.trim() || loading}
                  className="flex-1 py-2 rounded-lg bg-chaptr-orange hover:bg-orange-600 disabled:opacity-40 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={13} />
                  ) : (
                    <MessageSquare size={13} />
                  )}
                  Send Request
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    api.getApplication(id).then((data) => {
      setApp(data);
      setLoading(false);
    });
  }, [id]);

  const handleDecision = (type) => {
    const messages = {
      approved: "Application approved — student notified",
      rejected: "Application rejected",
      more_info: "Request sent to student",
    };
    setToast({ message: messages[type], type: "success" });
    setTimeout(() => navigate("/"), 2000);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex-1 flex items-center justify-center py-32">
          <Loader2 className="animate-spin text-chaptr-primary" size={32} />
        </div>
      </AdminLayout>
    );
  }

  if (!app) {
    return (
      <AdminLayout>
        <div className="flex-1 flex items-center justify-center py-32">
          <div className="text-center">
            <p className="text-gray-500">Application not found.</p>
            <button onClick={() => navigate("/")} className="mt-3 text-chaptr-primary text-sm underline">
              Back to list
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center gap-4 sticky top-0 z-10">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors font-medium"
        >
          <ArrowLeft size={15} />
          Applications
        </button>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-semibold text-chaptr-dark truncate max-w-[200px]">
          {app.full_name}
        </span>
        <StatusBadge status={app.status} />
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-400 font-mono">{app.id}</span>
        </div>
      </header>

      {/* Three-panel layout */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[260px_1fr_280px] gap-5 items-start">

        {/* ── Left: Student Info ── */}
        <div className="space-y-4">
          {/* Avatar + name */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex flex-col items-center text-center gap-2 mb-4 pb-4 border-b border-gray-100">
              <div className="w-14 h-14 bg-chaptr-purple/10 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-chaptr-purple">
                  {app.full_name?.[0]?.toUpperCase() ?? "?"}
                </span>
              </div>
              <div>
                <p className="font-semibold text-chaptr-dark">{app.full_name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Applied {app.created_at ? timeAgo(app.created_at) : "—"}
                </p>
              </div>
            </div>
            <div className="space-y-0">
              <InfoRow icon={Phone} label="Phone" value={app.phone} />
              <InfoRow icon={Mail} label="Email" value={app.email} />
              <InfoRow
                icon={Calendar}
                label="Date of birth"
                value={
                  app.date_of_birth
                    ? `${app.date_of_birth} (age ${calcAge(app.date_of_birth)})`
                    : "—"
                }
              />
              <InfoRow icon={CreditCard} label="National ID" value={app.national_id} />
              <InfoRow
                icon={MapPin}
                label="Location"
                value={
                  app.county && app.town
                    ? `${app.town}, ${app.county}`
                    : app.county ?? app.town ?? "—"
                }
              />
              <InfoRow
                icon={Briefcase}
                label="Employment"
                value={app.employment_status
                  ?.replace(/_/g, " ")
                  ?.replace(/\b\w/g, (c) => c.toUpperCase())}
              />
              <InfoRow
                icon={GraduationCap}
                label="Education"
                value={app.education_level
                  ?.replace(/_/g, " ")
                  ?.replace(/\b\w/g, (c) => c.toUpperCase())}
              />
            </div>
          </div>

          {/* Gender */}
          {app.gender && (
            <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-gray-400">Gender</span>
              <span className="text-xs font-semibold text-gray-700 capitalize">
                {app.gender}
              </span>
            </div>
          )}

          {/* Next of kin */}
          {app.kin_name && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Next of Kin
              </p>
              <InfoRow icon={User} label="Name" value={app.kin_name} />
              <InfoRow icon={Phone} label="Phone" value={app.kin_phone} />
              <InfoRow icon={Mail} label="Email" value={app.kin_email} />
              <div className="flex justify-between pt-1">
                <span className="text-xs text-gray-400">Relationship</span>
                <span className="text-xs font-semibold text-gray-700 capitalize">
                  {app.kin_relationship}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Middle: Application Progress ── */}
        <div className="space-y-4">
          {/* School + plan */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={`https://placehold.co/40x40/${
                  { "1": "00C896", "2": "FF6B35", "3": "6644bb" }[app.school_id] ?? "888888"
                }/ffffff?text=${app.school_name?.[0] ?? "?"}`}
                alt={app.school_name}
                className="w-10 h-10 rounded-lg"
              />
              <div>
                <p className="text-sm font-semibold text-chaptr-dark">
                  {app.school_name}
                </p>
                <p className="text-xs text-gray-400">{app.plan_name}</p>
              </div>
              <span
                className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${
                  app.plan_type === "isa"
                    ? "bg-green-100 text-green-700"
                    : "bg-purple-100 text-purple-700"
                }`}
              >
                {app.plan_type === "isa" ? "ISA" : "Lipa Mdogo Mdogo"}
              </span>
            </div>
            <TermsCard app={app} />
          </div>

          {/* Step tracker */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Application Progress
            </p>
            <StepTracker app={app} />
          </div>

          {/* Signed-at info if applicable */}
          {app.signed_at && (
            <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center gap-3">
              <PenLine className="text-chaptr-primary flex-shrink-0" size={16} />
              <div>
                <p className="text-xs font-semibold text-gray-700">
                  Contract signed
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(app.signed_at).toLocaleString("en-KE")}
                </p>
              </div>
            </div>
          )}

          {/* More-info request if sent */}
          {app.more_info_request && (
            <div className="bg-orange-50 border border-orange-100 rounded-xl px-5 py-4 space-y-1">
              <p className="text-xs font-semibold text-orange-700 flex items-center gap-1.5">
                <MessageSquare size={12} /> More info requested
              </p>
              <p className="text-xs text-orange-600">{app.more_info_request}</p>
            </div>
          )}
        </div>

        {/* ── Right: Decision Panel ── */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <DecisionPanel app={app} onDecision={handleDecision} />
          </div>

          {/* Quick stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Timeline
            </p>
            <div className="space-y-2 text-xs">
              {[
                {
                  icon: FileCheck,
                  label: "Application submitted",
                  value: app.created_at ? timeAgo(app.created_at) : "—",
                },
                {
                  icon: BookOpen,
                  label: "Vetting completed",
                  value: app.vetting_completed_at
                    ? timeAgo(app.vetting_completed_at)
                    : "Pending",
                },
                {
                  icon: CheckCircle2,
                  label: "Decision made",
                  value: app.decided_at
                    ? timeAgo(app.decided_at)
                    : "Pending",
                },
                {
                  icon: PenLine,
                  label: "Contract signed",
                  value: app.signed_at
                    ? timeAgo(app.signed_at)
                    : "Pending",
                },
              ].map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="flex items-center gap-2.5 text-gray-500"
                >
                  <Icon
                    className={
                      value !== "Pending"
                        ? "text-chaptr-primary"
                        : "text-gray-300"
                    }
                    size={13}
                    flexShrink={0}
                  />
                  <span className="flex-1">{label}</span>
                  <span
                    className={`font-medium ${
                      value === "Pending" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
    </AdminLayout>
  );
}
