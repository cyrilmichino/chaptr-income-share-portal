import { useNavigate, useLocation } from "react-router-dom";
import { Users, FileText, Banknote, Menu, X } from "lucide-react";
import { useState } from "react";

const NAV = [
  { path: "/", label: "Applications", icon: Users },
  { path: "/contracts", label: "Contracts", icon: FileText },
  { path: "/settlements", label: "Settlements", icon: Banknote },
];

export default function AdminLayout({ children, badge = {} }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  const SidebarContent = () => (
    <>
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-chaptr-hover rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">C</span>
          </div>
          <span className="text-white font-semibold text-sm">Chaptr Admin</span>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ path, label, icon: Icon }) => (
          <button
            key={path}
            onClick={() => { navigate(path); setMobileOpen(false); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive(path)
                ? "bg-white/15 text-white"
                : "text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon size={15} />
            {label}
            {badge[path] > 0 && (
              <span className="ml-auto bg-chaptr-orange text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {badge[path]}
              </span>
            )}
          </button>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-white/10">
        <p className="text-xs text-white/30">Demo v1.0</p>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar */}
      <aside className="w-56 bg-chaptr-dark flex-shrink-0 flex-col hidden md:flex">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-56 bg-chaptr-dark flex flex-col z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg hover:bg-gray-100"
          >
            <Menu size={18} className="text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-chaptr-hover rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">C</span>
            </div>
            <span className="font-semibold text-sm text-chaptr-dark">
              Chaptr Admin
            </span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
