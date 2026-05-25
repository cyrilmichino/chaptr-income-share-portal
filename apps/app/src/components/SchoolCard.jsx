import { CheckCircle2 } from "lucide-react";

export default function SchoolCard({ school, selected, onClick }) {
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
      <img
        src={school.logo}
        alt={school.name}
        className="w-16 h-16 rounded-xl object-cover mb-3"
      />
      <h3 className="font-semibold text-chaptr-dark text-sm leading-tight mb-1">
        {school.name}
      </h3>
      <p className="text-xs text-gray-500 leading-snug">{school.tagline}</p>
    </button>
  );
}
