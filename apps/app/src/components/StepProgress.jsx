import { Check } from "lucide-react";

export default function StepProgress({ current, total, steps }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        {steps.map((label, i) => {
          const stepNum = i + 1;
          const isDone = stepNum < current;
          const isActive = stepNum === current;
          return (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div className="flex items-center w-full">
                {i > 0 && (
                  <div
                    className={`flex-1 h-0.5 ${
                      isDone || isActive ? "bg-chaptr-primary" : "bg-gray-200"
                    }`}
                  />
                )}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 transition-all duration-300 ${
                    isDone
                      ? "bg-chaptr-primary text-white"
                      : isActive
                      ? "bg-chaptr-primary text-white ring-4 ring-green-100"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {isDone ? <Check size={14} /> : stepNum}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 ${
                      isDone ? "bg-chaptr-primary" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
              <span
                className={`text-xs mt-1.5 text-center hidden sm:block ${
                  isActive ? "text-chaptr-primary font-medium" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
