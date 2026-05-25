import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "shared/api";
import StepProgress from "../components/StepProgress";
import {
  Clock,
  XCircle,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ChevronDown,
  PenLine,
  PartyPopper,
  Phone,
  Mail,
  User,
  Heart,
} from "lucide-react";

const STEPS = ["School & Plan", "Credit Vetting", "ISA Education", "Contract"];

function formatKES(n) {
  return `KES ${Number(n).toLocaleString("en-KE")}`;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Field / Input primitives ─────────────────────────────────────────────────
function Field({ label, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-chaptr-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-chaptr-primary/30 focus:border-chaptr-primary transition-colors ${className}`}
      {...props}
    />
  );
}

function SelectField({ children, className = "", ...props }) {
  return (
    <div className="relative">
      <select
        className={`w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-chaptr-dark focus:outline-none focus:ring-2 focus:ring-chaptr-primary/30 focus:border-chaptr-primary appearance-none transition-colors ${className}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        size={15}
      />
    </div>
  );
}

// ─── Terms Summary Card ───────────────────────────────────────────────────────
function TermsSummaryCard({ app }) {
  const plan = app?.plan_details ?? {};
  const isISA = app?.plan_type === "isa";

  const rows = isISA
    ? [
        { label: "School", value: app?.school_name },
        { label: "Program", value: app?.plan_name },
        { label: "Tuition", value: formatKES(plan.tuition_amount) },
        {
          label: "Income Share",
          value: `${(plan.income_share_pct * 100).toFixed(0)}% of monthly income`,
        },
        {
          label: "Payment Cap",
          value: `${formatKES(plan.tuition_amount * plan.payment_cap_multiplier)} (${plan.payment_cap_multiplier}x)`,
        },
        {
          label: "Repayment Term",
          value: `${plan.repayment_term_months} months`,
        },
        {
          label: "Income Threshold",
          value: `${formatKES(plan.income_threshold_kes)}/month`,
        },
        {
          label: "Grace Period",
          value: `${plan.grace_period_months} months post-graduation`,
        },
      ]
    : [
        { label: "School", value: app?.school_name },
        { label: "Program", value: app?.plan_name },
        { label: "Tuition", value: formatKES(plan.tuition_amount) },
        {
          label: "Installments",
          value: `${plan.installment_count} × ${formatKES(plan.installment_amount_kes)}/month`,
        },
        { label: "Late Fee", value: formatKES(plan.late_fee_kes) },
      ];

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3 bg-white border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Your {isISA ? "ISA" : "Lipa Mdogo Mdogo"} Terms
        </p>
      </div>
      <div className="divide-y divide-gray-100">
        {rows.map(({ label, value }) => (
          <div
            key={label}
            className="flex items-center justify-between px-5 py-3"
          >
            <span className="text-xs text-gray-500">{label}</span>
            <span className="text-xs font-semibold text-chaptr-dark text-right max-w-[60%]">
              {value ?? "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Pending state ────────────────────────────────────────────────────────────
function PendingState({ app }) {
  return (
    <div className="space-y-5">
      {/* Pulse card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-8 flex flex-col items-center text-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center">
            <Clock className="text-chaptr-orange" size={28} />
          </div>
          <span className="absolute inset-0 rounded-full animate-ping bg-orange-100 opacity-60" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-chaptr-dark mb-1">
            Application under review
          </h2>
          <p className="text-sm text-gray-500 max-w-sm">
            Our team is reviewing your documents and application. We'll notify
            you once a decision has been made.
          </p>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-lg px-4 py-2.5 text-xs text-orange-700 font-medium">
          Estimated response: 3–5 business days
        </div>
      </div>

      {/* Application summary */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Application Summary
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "School", value: app?.school_name },
            { label: "Plan", value: app?.plan_name },
            { label: "Submitted", value: formatDate(app?.created_at) },
            { label: "Status", value: "Under Review" },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-gray-400">{label}</p>
              <p className="text-sm font-medium text-gray-800 mt-0.5">
                {value ?? "—"}
              </p>
            </div>
          ))}
        </div>
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Reference ID:{" "}
            <span className="font-mono font-medium text-gray-600">
              {app?.id}
            </span>
          </p>
        </div>
      </div>

      <p className="text-xs text-center text-gray-400">
        This page refreshes automatically. Come back here anytime using your
        reference ID.
      </p>
    </div>
  );
}

// ─── Rejected state ───────────────────────────────────────────────────────────
function RejectedState({ app }) {
  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-red-100 shadow-sm px-6 py-8 flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
          <XCircle className="text-red-400" size={30} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-chaptr-dark mb-1">
            Application not approved
          </h2>
          <p className="text-sm text-gray-500 max-w-sm">
            We're sorry — your application did not meet our criteria at this
            time.
          </p>
        </div>
        {app?.rejection_reason && (
          <div className="w-full bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-left space-y-1">
            <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">
              Reason
            </p>
            <p className="text-sm text-red-800">{app.rejection_reason}</p>
          </div>
        )}
        <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5 text-xs text-gray-600">
          You may re-apply after{" "}
          <span className="font-semibold">90 days</span> from today.
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-chaptr-dark">Need help?</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Our support team can clarify the decision or guide your next steps.
          </p>
        </div>
        <a
          href="mailto:support@chaptr.global"
          className="flex-shrink-0 text-xs font-semibold text-chaptr-primary border border-chaptr-primary px-4 py-2 rounded-lg hover:bg-green-50 transition-colors"
        >
          Contact Support
        </a>
      </div>
    </div>
  );
}

// ─── Approved state ───────────────────────────────────────────────────────────
function ApprovedState({ app, onSigned }) {
  const [kin, setKin] = useState({
    kin_name: "",
    kin_relationship: "",
    kin_phone: "",
    kin_email: "",
  });
  const [kinErrors, setKinErrors] = useState({});

  const [agreed, setAgreed] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [signatureError, setSignatureError] = useState("");
  const [signing, setSigning] = useState(false);

  const nameMatches =
    signatureName.trim().toLowerCase() ===
    (app?.full_name || "").trim().toLowerCase();
  const canSign = agreed && nameMatches && Object.values(kin).every((v) => v.trim());

  const handleKin = (e) => {
    const { name, value } = e.target;
    setKin((prev) => ({ ...prev, [name]: value }));
    if (kinErrors[name]) setKinErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateKin = () => {
    const e = {};
    if (!kin.kin_name.trim()) e.kin_name = "Required";
    if (!kin.kin_relationship) e.kin_relationship = "Required";
    if (!kin.kin_phone.trim()) e.kin_phone = "Required";
    if (!kin.kin_email.trim()) e.kin_email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(kin.kin_email))
      e.kin_email = "Enter a valid email";
    return e;
  };

  const handleSign = async () => {
    const kinErrs = validateKin();
    if (Object.keys(kinErrs).length) {
      setKinErrors(kinErrs);
      return;
    }
    if (!nameMatches) {
      setSignatureError(
        `Name must match exactly: "${app?.full_name}"`
      );
      return;
    }
    setSigning(true);
    try {
      await api.updateApplication(app.id, {
        ...kin,
        status: "contract_signed",
        step: 4,
        signed_at: new Date().toISOString(),
      });
      // Persist id so dashboard can load the application
      localStorage.setItem("chaptr_signed_app_id", app.id);
      onSigned();
    } catch (err) {
      console.error(err);
      setSigning(false);
    }
  };

  const plan = app?.plan_details ?? {};
  const isISA = app?.plan_type === "isa";

  const contractText = isISA
    ? `This Income Share Agreement ("ISA") is entered into between ${app?.full_name ?? "the Student"} ("Student") and Chaptr Global ("Chaptr"). Chaptr agrees to fund the Student's tuition of ${formatKES(plan.tuition_amount)} at ${app?.school_name}. In return, the Student agrees to pay ${(plan.income_share_pct * 100).toFixed(0)}% of their gross monthly income for ${plan.repayment_term_months} months, commencing ${plan.grace_period_months} months after graduation, provided their income exceeds ${formatKES(plan.income_threshold_kes)} per month. Total repayment is capped at ${formatKES(plan.tuition_amount * plan.payment_cap_multiplier)}. Payments are waived in any month where the Student's income falls below the threshold. This agreement is governed by the laws of Kenya.`
    : `This Lipa Mdogo Mdogo agreement is entered into between ${app?.full_name ?? "the Student"} ("Student") and Chaptr Global ("Chaptr"). Chaptr agrees to fund the Student's tuition of ${formatKES(plan.tuition_amount)} at ${app?.school_name}. In return, the Student agrees to pay ${plan.installment_count} monthly installments of ${formatKES(plan.installment_amount_kes)}. A late fee of ${formatKES(plan.late_fee_kes)} applies to missed payments. This agreement is governed by the laws of Kenya.`;

  return (
    <div className="space-y-6">
      {/* Success banner */}
      <div className="bg-green-50 border border-green-200 rounded-xl px-6 py-5 flex items-center gap-4">
        <div className="w-12 h-12 bg-chaptr-primary rounded-xl flex items-center justify-center flex-shrink-0">
          <PartyPopper className="text-white" size={22} />
        </div>
        <div>
          <h2 className="text-base font-bold text-chaptr-dark">
            Congratulations, {app?.full_name?.split(" ")[0]}! Your application has been approved
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Please complete the form below and sign your contract to get started.
          </p>
        </div>
      </div>

      {/* Next of Kin */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Heart className="text-chaptr-orange" size={17} />
          <h3 className="text-sm font-semibold text-chaptr-dark">
            Next of Kin
          </h3>
        </div>
        <p className="text-xs text-gray-500 -mt-3">
          Provide details of someone we can contact in case of emergency.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Full name" error={kinErrors.kin_name}>
            <div className="relative">
              <User
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
                size={14}
              />
              <Input
                name="kin_name"
                placeholder="e.g. Jane Wanjiku"
                value={kin.kin_name}
                onChange={handleKin}
                className={`pl-9 ${kinErrors.kin_name ? "border-red-300" : ""}`}
              />
            </div>
          </Field>

          <Field label="Relationship" error={kinErrors.kin_relationship}>
            <SelectField
              name="kin_relationship"
              value={kin.kin_relationship}
              onChange={handleKin}
              className={kinErrors.kin_relationship ? "border-red-300" : ""}
            >
              <option value="">Select relationship</option>
              {["Parent", "Sibling", "Spouse", "Friend", "Other"].map((r) => (
                <option key={r} value={r.toLowerCase()}>
                  {r}
                </option>
              ))}
            </SelectField>
          </Field>

          <Field label="Phone number" error={kinErrors.kin_phone}>
            <div className="relative">
              <Phone
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
                size={14}
              />
              <Input
                name="kin_phone"
                placeholder="07XX XXX XXX"
                value={kin.kin_phone}
                onChange={handleKin}
                className={`pl-9 ${kinErrors.kin_phone ? "border-red-300" : ""}`}
              />
            </div>
          </Field>

          <Field label="Email address" error={kinErrors.kin_email}>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
                size={14}
              />
              <Input
                type="email"
                name="kin_email"
                placeholder="jane@example.com"
                value={kin.kin_email}
                onChange={handleKin}
                className={`pl-9 ${kinErrors.kin_email ? "border-red-300" : ""}`}
              />
            </div>
          </Field>
        </div>
      </div>

      {/* Terms summary */}
      <TermsSummaryCard app={app} />

      {/* Contract signing */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-2">
          <PenLine className="text-chaptr-purple" size={17} />
          <h3 className="text-sm font-semibold text-chaptr-dark">
            Sign your contract
          </h3>
        </div>

        {/* Contract text */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 text-sm text-gray-600 leading-relaxed max-h-36 overflow-y-auto">
          {contractText}
        </div>

        {/* Agree checkbox */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded accent-[#3366CC] flex-shrink-0 cursor-pointer"
          />
          <span className="text-sm text-gray-700 leading-snug group-hover:text-chaptr-dark transition-colors">
            I have read and agree to the terms of this agreement
          </span>
        </label>

        {/* Typed signature */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Type your full name as your digital signature
          </label>
          <Input
            value={signatureName}
            onChange={(e) => {
              setSignatureName(e.target.value);
              setSignatureError("");
            }}
            placeholder={app?.full_name ?? "Your full name"}
            className={`font-medium italic ${
              signatureName && !nameMatches
                ? "border-red-300 bg-red-50"
                : signatureName && nameMatches
                ? "border-chaptr-primary bg-green-50"
                : ""
            }`}
          />
          {signatureName && !nameMatches && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle size={11} />
              Must match exactly:{" "}
              <span className="font-medium">{app?.full_name}</span>
            </p>
          )}
          {signatureName && nameMatches && (
            <p className="text-xs text-chaptr-primary flex items-center gap-1">
              <CheckCircle2 size={11} /> Signature confirmed
            </p>
          )}
          {signatureError && (
            <p className="text-xs text-red-500">{signatureError}</p>
          )}
        </div>

        <button
          type="button"
          onClick={handleSign}
          disabled={!canSign || signing}
          className="w-full bg-chaptr-primary hover:bg-chaptr-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-200"
        >
          {signing ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              Signing contract...
            </>
          ) : (
            <>
              <PenLine size={16} />
              Sign Contract & Enroll
            </>
          )}
        </button>

        {!canSign && (
          <p className="text-xs text-center text-gray-400">
            Complete all fields above and sign to proceed
          </p>
        )}
      </div>

      <div className="h-4" />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ContractPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef(null);

  const fetchApp = async () => {
    try {
      const data = await api.getApplication(id);
      setApp(data);
      setLoading(false);
      // Stop polling once a terminal status is reached
      if (
        ["approved", "contract_sent", "contract_signed", "rejected"].includes(
          data.status
        )
      ) {
        clearInterval(pollRef.current);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchApp();
    pollRef.current = setInterval(fetchApp, 3000);
    return () => clearInterval(pollRef.current);
  }, [id]);

  const handleSigned = () => {
    navigate("/dashboard");
  };

  const isPending =
    !app ||
    ["vetting_complete", "pending_decision", "pending_vetting", "draft"].includes(
      app.status
    );
  const isRejected = app?.status === "rejected";
  const isApproved = ["approved", "contract_sent"].includes(app?.status);
  const isSigned = app?.status === "contract_signed";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f2f9] flex items-center justify-center">
        <Loader2 className="animate-spin text-chaptr-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f2f9]">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-chaptr-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="font-semibold text-chaptr-dark">Chaptr Global</span>
            </div>
            {isPending && (
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                Auto-refreshing
              </span>
            )}
          </div>
          <StepProgress current={4} total={4} steps={STEPS} />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-2">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-chaptr-dark mb-1">
            Contract & Decision
          </h1>
          <p className="text-gray-500 text-sm">
            {isPending && "Waiting for your application to be reviewed by our team."}
            {isApproved && "Your application has been approved! Review your terms and sign below."}
            {isRejected && "Your application was reviewed and a decision has been made."}
            {isSigned && "Your contract has been signed. Redirecting to your dashboard..."}
          </p>
        </div>

        {isPending && <PendingState app={app} />}
        {isRejected && <RejectedState app={app} />}
        {isApproved && <ApprovedState app={app} onSigned={handleSigned} />}
        {isSigned && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-10 flex flex-col items-center text-center gap-3">
            <CheckCircle2 className="text-chaptr-primary" size={40} />
            <p className="text-base font-bold text-chaptr-dark">
              Contract signed!
            </p>
            <p className="text-sm text-gray-500">Redirecting to your dashboard...</p>
            <Loader2 className="animate-spin text-gray-300 mt-2" size={20} />
          </div>
        )}

        <div className="h-8" />
      </main>
    </div>
  );
}
