import { useNavigate } from "react-router-dom";
import { ArrowRight, Shield, Clock, TrendingUp } from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f4f2f9] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-chaptr-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-semibold text-chaptr-dark">Chaptr Global</span>
          </div>
          <span className="text-xs text-gray-400">ISA Portal</span>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="max-w-2xl">
          <div className="inline-block bg-green-100 text-green-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            Income Share Agreement — No upfront fees
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-chaptr-dark leading-tight mb-5">
            Invest in your future.
            <br />
            <span className="text-chaptr-primary">Pay when you earn.</span>
          </h1>
          <p className="text-gray-500 text-lg mb-10 leading-relaxed">
            Chaptr funds your education at top African institutions. You only
            repay once you're earning — and only a fair share of your income.
          </p>

          <button
            onClick={() => navigate("/apply")}
            className="inline-flex items-center gap-2 bg-chaptr-primary hover:bg-chaptr-hover text-white font-semibold px-8 py-4 rounded-xl text-base transition-all duration-200 shadow-lg shadow-green-200"
          >
            Start Your Application
            <ArrowRight size={18} />
          </button>

          <p className="text-xs text-gray-400 mt-4">
            Takes about 10 minutes — no credit score required
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 max-w-3xl w-full">
          {[
            {
              icon: Shield,
              title: "No upfront cost",
              desc: "We pay your tuition directly. You focus on learning.",
            },
            {
              icon: Clock,
              title: "Pay after graduation",
              desc: "Repayments only begin after your grace period ends.",
            },
            {
              icon: TrendingUp,
              title: "Income-based repayments",
              desc: "Only pay when earning above the income threshold.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 text-left"
            >
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-3">
                <Icon className="text-chaptr-primary" size={20} />
              </div>
              <h3 className="font-semibold text-chaptr-dark text-sm mb-1">
                {title}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} Chaptr Global. All rights reserved.
      </footer>
    </div>
  );
}
