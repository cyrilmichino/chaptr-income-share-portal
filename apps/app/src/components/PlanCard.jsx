import { CheckCircle2 } from "lucide-react";

function formatKES(n) {
  return `KES ${n.toLocaleString("en-KE")}`;
}

export default function PlanCard({ plan, selected, onClick }) {
  const isISA = plan.type === "isa";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full bg-white rounded-xl border-2 p-5 text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${
        selected
          ? "border-chaptr-primary shadow-md shadow-green-100"
          : "border-gray-100 shadow-sm"
      }`}
    >
      {selected && (
        <CheckCircle2
          className="absolute top-3 right-3 text-chaptr-primary"
          size={20}
          fill="currentColor"
          stroke="white"
        />
      )}

      <div className="flex items-start justify-between mb-3 pr-6">
        <h3 className="font-semibold text-chaptr-dark text-sm leading-tight">
          {plan.plan_name}
        </h3>
        <span
          className={`ml-2 flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
            isISA
              ? "bg-green-100 text-green-700"
              : "bg-purple-100 text-purple-700"
          }`}
        >
          {isISA ? "ISA" : "Lipa Mdogo Mdogo"}
        </span>
      </div>

      <div className="text-sm font-semibold text-gray-800 mb-2">
        Tuition: {formatKES(plan.tuition_amount)}
      </div>

      {isISA ? (
        <div className="space-y-1 text-xs text-gray-500">
          <p>
            {(plan.income_share_pct * 100).toFixed(0)}% of income for{" "}
            {plan.repayment_term_months} months
          </p>
          <p>
            Capped at {plan.payment_cap_multiplier}x tuition (
            {formatKES(plan.tuition_amount * plan.payment_cap_multiplier)})
          </p>
          <p>
            Income threshold: {formatKES(plan.income_threshold_kes)}/month
          </p>
          <p>Grace period: {plan.grace_period_months} months</p>
        </div>
      ) : (
        <div className="space-y-1 text-xs text-gray-500">
          <p>
            {plan.installment_count} installments of{" "}
            {formatKES(plan.installment_amount_kes)}/month
          </p>
          <p>Late fee: {formatKES(plan.late_fee_kes)}</p>
        </div>
      )}
    </button>
  );
}
