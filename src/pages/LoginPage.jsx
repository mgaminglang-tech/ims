import { useEffect, useMemo, useState } from "react";
import {
  Monitor,
  ShieldCheck,
  Database,
  BarChart3,
  Lock,
  User,
  Laptop,
  Printer,
  Boxes,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const API_BASE = "http://localhost:3001/api/dashboard";

export default function LoginPage() {
  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [dashboardData, setDashboardData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(true);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    const result = await login(form.username, form.password);

    if (result.success) {
      toast.success("Login successful");
      navigate("/");
    } else {
      toast.error(result.message || "Invalid username or password");
    }
  };

  useEffect(() => {
    const loadDashboardPreview = async () => {
      try {
        setLoadingPreview(true);

        const response = await fetch(API_BASE);
        if (!response.ok) {
          throw new Error("Failed to load dashboard preview");
        }

        const data = await response.json();
        setDashboardData(data);
      } catch (error) {
        console.error("Login preview dashboard error:", error);
        setDashboardData(null);
      } finally {
        setLoadingPreview(false);
      }
    };

    loadDashboardPreview();
  }, []);

  const previewStats = useMemo(() => {
    const summary = dashboardData?.summary || {};
    const byType = dashboardData?.byType || {};
    const byStatus = dashboardData?.byStatus || {};

    const laptops = Number(byType["LAPTOP"] || 0);
    const desktops = Number(byType["DESKTOP"] || 0);
    const printers = Number(byType["PRINTER"] || 0);

    const totalAssets = Number(summary.totalAssets || 0);
    const assigned = Number(summary.assigned || 0);
    const underRepair = Number(summary.underRepair || 0);
    const available = Number(summary.unassigned || 0);

    const working = Number(summary.working || byStatus["WORKING"] || 0);
    const notWorking = Number(summary.notWorking || byStatus["NOT WORKING"] || 0);
    const forRedeployment = Number(
      summary.forRedeployment ||
        byStatus["FOR RE-DEPLOYMENT"] ||
        byStatus["FOR REDEPLOYMENT"] ||
        0
    );
    const inactive = Number(summary.inactive || byStatus["INACTIVE"] || 0);

    const laptopDesktopTotal = laptops + desktops;
    const otherDevices = Math.max(totalAssets - laptopDesktopTotal - printers, 0);

    const getPercent = (value) => {
      if (!totalAssets) return 0;
      return Math.round((Number(value) / totalAssets) * 100);
    };

    return {
      totalAssets,
      assigned,
      underRepair,
      available,
      laptopDesktopTotal,
      printers,
      otherDevices,
      workingPercent: getPercent(working),
      notWorkingPercent: getPercent(notWorking),
      redeploymentPercent: getPercent(forRedeployment),
      inactivePercent: getPercent(inactive),
    };
  }, [dashboardData]);

  const formatCount = (value) => String(value || 0).padStart(2, "0");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8F3] via-[#F8FAFC] to-[#EFF6FF] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-6xl overflow-hidden rounded-3xl border border-[#E7EEF7] bg-white shadow-sm">
        <div className="grid lg:grid-cols-2 min-h-[700px]">
          {/* LEFT SIDE */}
          <div className="flex items-center justify-center p-8 md:p-12 bg-white">
            <div className="w-full max-w-md">
              <div className="mb-8">
                <div className="mb-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#FFE7D6] flex items-center justify-center border border-[#F3C9A9] shadow-sm">
                    <Monitor className="w-5 h-5 text-[#C96A2B]" />
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

                <h2 className="text-2xl font-semibold text-slate-900">
                  Welcome back
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  Sign in to access your assets, dashboard insights,
                  import/export tools, and inventory records.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={form.username}
                      onChange={(e) => handleChange("username", e.target.value)}
                      placeholder="Enter username"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      placeholder="Enter password"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  Sign In
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="w-full text-sm font-medium text-blue-600 transition hover:text-blue-700"
                >
                  Forgot Password?
                </button>
              </form>

              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                  <ShieldCheck className="mb-2 h-5 w-5 text-emerald-600" />
                  <p className="text-xs font-semibold text-slate-800">Secure Access</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Protected login for authorized users
                  </p>
                </div>

                <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                  <Database className="mb-2 h-5 w-5 text-blue-600" />
                  <p className="text-xs font-semibold text-slate-800">Asset Records</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Centralized inventory management
                  </p>
                </div>

                <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                  <BarChart3 className="mb-2 h-5 w-5 text-orange-600" />
                  <p className="text-xs font-semibold text-slate-800">Insights</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Real-time dashboard reporting
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="hidden lg:flex items-center justify-center border-l border-[#E7EEF7] bg-gradient-to-br from-[#FFF8F3] via-[#F8FAFC] to-[#EFF6FF] p-10">
            <div className="w-full max-w-xl rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C96A2B]">
                    IMS Dashboard Preview
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-slate-900">
                    System Overview
                  </h3>
                </div>
                <div className="rounded-xl border border-[#F3DDCF] bg-[#FFF8F3] px-3 py-1 text-xs font-medium text-[#C96A2B]">
                  {loadingPreview ? "Loading..." : "Live Preview"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                  <p className="text-xs font-medium text-slate-500">Total Assets</p>
                  <h4 className="mt-2 text-2xl font-bold text-slate-900">
                    {formatCount(previewStats.totalAssets)}
                  </h4>
                  <p className="mt-1 text-xs text-slate-500">Tracked inventory</p>
                </div>

                <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                  <p className="text-xs font-medium text-slate-500">Assigned</p>
                  <h4 className="mt-2 text-2xl font-bold text-slate-900">
                    {formatCount(previewStats.assigned)}
                  </h4>
                  <p className="mt-1 text-xs text-slate-500">Currently in use</p>
                </div>

                <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                  <p className="text-xs font-medium text-slate-500">Under Repair</p>
                  <h4 className="mt-2 text-2xl font-bold text-slate-900">
                    {formatCount(previewStats.underRepair)}
                  </h4>
                  <p className="mt-1 text-xs text-slate-500">Need maintenance</p>
                </div>

                <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                  <p className="text-xs font-medium text-slate-500">Available</p>
                  <h4 className="mt-2 text-2xl font-bold text-slate-900">
                    {formatCount(previewStats.available)}
                  </h4>
                  <p className="mt-1 text-xs text-slate-500">Ready for use</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">Asset Categories</p>
                  <p className="text-xs text-slate-400">Overview</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Laptop className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-slate-700">
                        Laptops & Desktops
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">
                      {previewStats.laptopDesktopTotal}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Printer className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-medium text-slate-700">
                        Printers
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">
                      {previewStats.printers}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Boxes className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium text-slate-700">
                        Other Devices
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">
                      {previewStats.otherDevices}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">Asset Status</p>
                  <p className="text-xs text-slate-400">Current distribution</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-slate-500">
                      <span>Working</span>
                      <span>{previewStats.workingPercent}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${previewStats.workingPercent}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 flex justify-between text-xs text-slate-500">
                      <span>Not Working</span>
                      <span>{previewStats.notWorkingPercent}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-red-500 transition-all duration-500"
                        style={{ width: `${previewStats.notWorkingPercent}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 flex justify-between text-xs text-slate-500">
                      <span>For Re-deployment</span>
                      <span>{previewStats.redeploymentPercent}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-amber-500 transition-all duration-500"
                        style={{ width: `${previewStats.redeploymentPercent}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 flex justify-between text-xs text-slate-500">
                      <span>Inactive</span>
                      <span>{previewStats.inactivePercent}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-slate-400 transition-all duration-500"
                        style={{ width: `${previewStats.inactivePercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <p className="mt-5 text-center text-xs text-slate-500">
                Manage assets, records, inventory status, and reports in one system
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}