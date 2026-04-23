import { Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Monitor,
  Search,
  FileText,
  Upload,
  FolderOpen,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/assets", label: "Assets", icon: Monitor },
  { path: "/search", label: "Search", icon: Search },
  { path: "/forms", label: "Forms", icon: FileText },
  { path: "/import-export", label: "Import / Export", icon: Upload },
  { path: "/documents", label: "Documents", icon: FolderOpen },
];

export default function Layout() {
  const location = useLocation();
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="bg-[#FFF4EC] border-b border-[#F3DDCF] sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#FFE7D6] flex items-center justify-center border border-[#F3C9A9] shadow-sm">
                <Monitor className="w-4 h-4 text-[#C96A2B]" />
              </div>

              <div>
                <h1 className="text-sm font-bold tracking-wide text-slate-900">
                  IT Inventory Management System
                </h1>
                <p className="text-[10px] text-slate-500 tracking-widest uppercase">
                  Asset Management Dashboard
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-800">
                  {user?.name || "Local Admin"}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-slate-500">
                  {user?.role || "admin"}
                </span>
              </div>

            <button
  onClick={logout}
  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
>
  <LogOut className="w-4 h-4" />
  Logout
</button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-[#EFF6FF] border-b border-[#D9EAFE] sticky top-14 z-40">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 border ${
                    isActive
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-slate-700 border-blue-100 hover:bg-blue-100 hover:text-blue-700 hover:border-blue-200"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? "text-white"
                        : "text-slate-500 group-hover:text-blue-700"
                    }`}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}