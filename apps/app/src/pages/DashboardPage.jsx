import { useState, useEffect } from "react";
import { api } from "shared/api";
import {
  CheckCircle2,
  Lock,
  GraduationCap,
  TrendingUp,
  FileText,
  Calendar,
  ChevronRight,
  Loader2,
  BookOpen,
  Banknote,
} from "lucide-react";

function formatKES(n) {
  return `KES ${Number(n).toLocaleString("en-KE")}`;
}

function nextMonthFifth() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 5);
  return d.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const TIMELINE = [
  { label: "Application approved", done: true },
  { label: "Contract signed", done: true },
  { label: "Submit monthly reports while learning", done: false, active: true },
  { label: "Graduate", done: false },
  { label: "Begin repayment", done: false },
];

export default function DashboardPage() {
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedId = localStorage.getItem("chaptr_signed_app_id");
    if (savedId) {
      api.getApplication(savedId).then((data) => {
        setApp(data);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f2f9] flex items-center justify-center">
        <Loader2 className="animate-spin text-chaptr-primary" size={32} />
      </div>
    );
  }

  const plan = app?.plan_details ?? {};
  const isISA = app?.plan_type === "isa";
  const firstName = app?.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="min-h-screen bg-[#f4f2f9]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-chaptr-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-semibold text-chaptr-dark">Chaptr Global</span>
          </div>
          <span className="text-xs font-medium text-gray-500 bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
            Enrolled
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Welcome banner */}
        <div className="bg-chaptr-primary rounded-2xl px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-green-100 text-xs font-medium mb-1 uppercase tracking-wide">
              Welcome back
            </p>
            <h1 className="text-white text-2xl font-bold">
              Welcome, {firstName}! You're now enrolled.
            </h1>
            <p className="text-green-100 text-sm mt-1">
              {app?.school_name} · {app?.plan_name}
            </p>
          </div>
          <div className="bg-white/20 rounded-xl px-4 py-3 text-center flex-shrink-0">
            <p className="text-white/80 text-xs">Phase</p>
            <p className="text-white font-bold text-sm mt-0.5">
              Still Learning
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column — 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status card */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="text-chaptr-purple" size={18} />
                <h2 className="text-sm font-semibold text-chaptr-dark">
                  Enrollment Status
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "School", value: app?.school_name },
                  { label: "Program", value: app?.plan_name },
                  {
                    label: "Expected graduation",
                    value: (() => {
                      const d = new Date();
                      d.setMonth(
                        d.getMonth() + (plan.repayment_term_months ?? 12)
                      );
                      return d.toLocaleDateString("en-KE", {
                        month: "long",
                        year: "numeric",
                      });
                    })(),
                  },
                  { label: "Next report due", value: nextMonthFifth() },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="text-sm font-medium text-gray-800 mt-0.5">
                      {value ?? "—"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly report — locked preview */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="text-gray-400" size={16} />
                  <h2 className="text-sm font-semibold text-chaptr-dark">
                    Monthly Report
                  </h2>
                </div>
                <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                  <Lock size={10} />
                  Locked
                </span>
              </div>
              <div className="px-5 py-5 space-y-4">
                <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                  <Calendar className="text-blue-400 flex-shrink-0 mt-0.5" size={15} />
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Your first monthly report will be due on{" "}
                    <span className="font-semibold">{nextMonthFifth()}</span>.
                    Reports unlock as you progress through your program.
                  </p>
                </div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  What you'll report each month
                </p>
                <div className="space-y-2">
                  {[
                    "Employment status and employer details",
                    "Gross monthly income",
                    "Bank account for repayments (when applicable)",
                    "Any changes to your contact information",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-1.5 h-1.5 bg-gray-300 rounded-full flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* What happens next timeline */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-chaptr-orange" size={17} />
                <h2 className="text-sm font-semibold text-chaptr-dark">
                  What happens next
                </h2>
              </div>
              <div className="space-y-0">
                {TIMELINE.map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                          step.done
                            ? "bg-chaptr-primary"
                            : step.active
                            ? "bg-white border-2 border-chaptr-primary"
                            : "bg-gray-100 border-2 border-gray-200"
                        }`}
                      >
                        {step.done ? (
                          <CheckCircle2
                            className="text-white"
                            size={14}
                            fill="currentColor"
                            stroke="white"
                          />
                        ) : step.active ? (
                          <ChevronRight
                            className="text-chaptr-primary"
                            size={14}
                          />
                        ) : (
                          <div className="w-2 h-2 bg-gray-300 rounded-full" />
                        )}
                      </div>
                      {i < TIMELINE.length - 1 && (
                        <div
                          className={`w-0.5 h-8 mt-0.5 ${
                            step.done ? "bg-chaptr-primary" : "bg-gray-200"
                          }`}
                        />
                      )}
                    </div>
                    <div className="pb-6 pt-1">
                      <p
                        className={`text-sm ${
                          step.done
                            ? "text-gray-400 line-through"
                            : step.active
                            ? "text-chaptr-dark font-semibold"
                            : "text-gray-400"
                        }`}
                      >
                        {step.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column — repayment preview */}
          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 bg-chaptr-dark border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <Banknote className="text-chaptr-primary" size={16} />
                  <p className="text-xs font-semibold text-white uppercase tracking-wide">
                    Your Repayment Preview
                  </p>
                </div>
              </div>
              <div className="px-5 py-5 space-y-3">
                {isISA ? (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Income share</span>
                      <span className="font-semibold text-chaptr-dark">
                        {(plan.income_share_pct * 100).toFixed(0)}% of income
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Repayment term</span>
                      <span className="font-semibold text-chaptr-dark">
                        {plan.repayment_term_months} months
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Income threshold</span>
                      <span className="font-semibold text-chaptr-dark">
                        {formatKES(plan.income_threshold_kes)}/mo
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Total cap</span>
                      <span className="font-semibold text-chaptr-dark">
                        {formatKES(
                          plan.tuition_amount * plan.payment_cap_multiplier
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Grace period</span>
                      <span className="font-semibold text-chaptr-dark">
                        {plan.grace_period_months} months
                      </span>
                    </div>
                    <div className="border-t border-gray-100 pt-3">
                      <p className="text-xs text-gray-400 mb-2">
                        Example: earning KES 50,000/mo
                      </p>
                      <div className="bg-green-50 border border-green-100 rounded-lg px-3 py-2 flex justify-between text-xs">
                        <span className="text-gray-600">Monthly payment</span>
                        <span className="font-bold text-chaptr-primary">
                          {formatKES(
                            Math.round(
                              50000 * (plan.income_share_pct ?? 0.12)
                            )
                          )}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Monthly installment</span>
                      <span className="font-semibold text-chaptr-dark">
                        {formatKES(plan.installment_amount_kes)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Total installments</span>
                      <span className="font-semibold text-chaptr-dark">
                        {plan.installment_count}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Late fee</span>
                      <span className="font-semibold text-chaptr-dark">
                        {formatKES(plan.late_fee_kes)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Study tips */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
              <div className="flex items-center gap-2">
                <BookOpen className="text-chaptr-purple" size={16} />
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  While you study
                </p>
              </div>
              {[
                "Attend all classes and submit coursework on time",
                "Update your monthly report by the 5th of each month",
                "Contact your advisor if your situation changes",
              ].map((tip) => (
                <div key={tip} className="flex items-start gap-2 text-xs text-gray-500">
                  <CheckCircle2
                    className="text-chaptr-primary flex-shrink-0 mt-0.5"
                    size={12}
                  />
                  {tip}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="h-8" />
      </main>
    </div>
  );
}
