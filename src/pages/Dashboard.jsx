import { useState, useEffect } from "react";
import axios from "axios";
import DashboardCharts from "../components/dashboard/DashboardCharts";
import AssetForm from "../components/assets/AssetForm";
import AssetTable from "../components/assets/AssetTable";
import { Button } from "@/components/ui/button";
import {
  Plus,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  Boxes,
  UserCheck,
  UserX,
  Wrench,
  Archive,
  Clock3,
  PackageCheck,
  AlarmClockCheck,
} from "lucide-react";

const API_URL = "http://localhost:3001/api";

export default function Dashboard() {
  const [allItems, setAllItems] = useState([]);
  const [borrowRecords, setBorrowRecords] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editAsset, setEditAsset] = useState(null);

  const normalize = (value) => String(value || "").trim().toUpperCase();

  const isAssignedCustodian = (value) => {
    const custodian = String(value || "").trim().toUpperCase();
    return !!custodian && !["", "-", "UNASSIGNED", "N/A", "NONE", "NULL"].includes(custodian);
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const results = await Promise.allSettled([
        axios.get(`${API_URL}/assets`),
        axios.get(`${API_URL}/dashboard`),
        axios.get(`${API_URL}/borrow-records`),
      ]);

      const assetsRes = results[0];
      const dashboardRes = results[1];
      const borrowRes = results[2];

      if (assetsRes.status === "fulfilled") {
        const rawAssets = Array.isArray(assetsRes.value.data)
          ? assetsRes.value.data
          : [];
        setAllItems(rawAssets);
      } else {
        console.error("❌ Error loading assets:", assetsRes.reason);
        setAllItems([]);
      }

      if (borrowRes.status === "fulfilled") {
        const rawBorrows = Array.isArray(borrowRes.value.data)
          ? borrowRes.value.data
          : [];
        setBorrowRecords(rawBorrows);
      } else {
        console.error("❌ Error loading borrow records:", borrowRes.reason);
        setBorrowRecords([]);
      }

      if (dashboardRes.status === "fulfilled") {
        setDashboardData(dashboardRes.value.data || {});
      } else {
        console.error("❌ Error loading dashboard summary:", dashboardRes.reason);
        setDashboardData({});
      }
    } catch (error) {
      console.error("❌ Unexpected dashboard load error:", error);
      setAllItems([]);
      setBorrowRecords([]);
      setDashboardData({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const next30Days = new Date(today);
  next30Days.setDate(today.getDate() + 30);

  const activeBorrowedRecords = borrowRecords.filter((record) => {
    const status = normalize(record.status);
    return status === "BORROWED";
  });

  const overdueBorrowedRecords = activeBorrowedRecords.filter((record) => {
    const rawDate =
      record.expected_return_date ||
      record.due_date ||
      record.expectedReturnDate;

    if (!rawDate) return false;

    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return false;

    d.setHours(0, 0, 0, 0);
    return d < today;
  });

  const fallbackByType = allItems.reduce((acc, item) => {
    const type = normalize(item.asset_type);
    if (!type) return acc;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const fallbackByStatus = allItems.reduce((acc, item) => {
    const status = normalize(item.status);
    if (!status) return acc;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const fallbackByDepartment = allItems.reduce((acc, item) => {
    const department =
      item.department_name ||
      item.department ||
      item.dept ||
      item.section ||
      item.location ||
      item.office_department ||
      "Unassigned";

    const key = String(department || "").trim() || "Unassigned";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const fallbackSummary = (() => {
    const byStatus = fallbackByStatus;
    const totalAssets = allItems.length;

    const working =
      (byStatus["WORKING"] || 0) +
      (byStatus["ACTIVE"] || 0);

    const notWorking =
      (byStatus["NOT WORKING"] || 0) +
      (byStatus["NOT_WORKING"] || 0);

    const underRepair =
      (byStatus["UNDER REPAIR"] || 0) +
      (byStatus["UNDER_REPAIR"] || 0);

    const forRedeployment =
      (byStatus["FOR RE-DEPLOYMENT"] || 0) +
      (byStatus["FOR REDEPLOYMENT"] || 0) +
      (byStatus["FOR_REDEPLOYMENT"] || 0);

    const retired =
      (byStatus["RETIRED"] || 0) +
      (byStatus["FOR DISPOSAL"] || 0);

    const assigned = allItems.filter((item) => {
      const status = normalize(item.status);
      return status === "WORKING" && isAssignedCustodian(item.custodian);
    }).length;

    const unassigned = allItems.filter((item) => {
      const status = normalize(item.status);
      return status === "WORKING" && !isAssignedCustodian(item.custodian);
    }).length;

    const inWarranty = allItems.filter((item) => {
      if (!item.warranty_end) return false;
      const d = new Date(item.warranty_end);
      if (isNaN(d.getTime())) return false;
      d.setHours(0, 0, 0, 0);
      return d > next30Days;
    }).length;

    const expiringSoon = allItems.filter((item) => {
      if (!item.warranty_end) return false;
      const d = new Date(item.warranty_end);
      if (isNaN(d.getTime())) return false;
      d.setHours(0, 0, 0, 0);
      return d >= today && d <= next30Days;
    }).length;

    const warrantyExpired = allItems.filter((item) => {
      if (!item.warranty_end) return false;
      const d = new Date(item.warranty_end);
      if (isNaN(d.getTime())) return false;
      d.setHours(0, 0, 0, 0);
      return d < today;
    }).length;

    return {
      totalAssets,
      assigned,
      unassigned,
      working,
      notWorking,
      underRepair,
      forRedeployment,
      retired,
      inWarranty,
      expiringSoon,
      warrantyExpired,
      borrowed: activeBorrowedRecords.length,
      overdueReturn: overdueBorrowedRecords.length,
    };
  })();

  const backendSummary = dashboardData?.summary || {};

  const summary = {
    ...fallbackSummary,
    ...backendSummary,
    borrowed: activeBorrowedRecords.length,
    overdueReturn: overdueBorrowedRecords.length,
  };

  const byType =
    dashboardData?.byType && Object.keys(dashboardData.byType).length > 0
      ? dashboardData.byType
      : fallbackByType;

  const departmentCounts =
    dashboardData?.byDepartment &&
    Object.keys(dashboardData.byDepartment).length > 0
      ? dashboardData.byDepartment
      : fallbackByDepartment;

  const totalLaptops = byType["LAPTOP"] || 0;
  const totalDesktops = byType["DESKTOP"] || 0;
  const totalPrinters = byType["PRINTER"] || 0;

  const handleEdit = (asset) => {
    setEditAsset(asset);
    setShowForm(true);
  };

  const handleSaved = () => {
    setShowForm(false);
    setEditAsset(null);
    loadData();
  };

  const primaryCards = [
    {
      icon: <Boxes className="w-7 h-7 text-sky-600" />,
      bg: "bg-sky-100",
      value: summary.totalAssets || 0,
      label: "Total Assets",
      color: "text-sky-600",
    },
    {
      icon: <UserCheck className="w-7 h-7 text-indigo-600" />,
      bg: "bg-indigo-100",
      value: summary.assigned || 0,
      label: "Assigned",
      color: "text-indigo-600",
    },
    {
      icon: <UserX className="w-7 h-7 text-amber-600" />,
      bg: "bg-amber-100",
      value: summary.unassigned || 0,
      label: "Unassigned",
      color: "text-amber-600",
    },
    {
      icon: <PackageCheck className="w-7 h-7 text-violet-600" />,
      bg: "bg-violet-100",
      value: summary.borrowed || 0,
      label: "Borrowed",
      color: "text-violet-600",
    },
    {
      icon: <AlarmClockCheck className="w-7 h-7 text-red-700" />,
      bg: "bg-red-100",
      value: summary.overdueReturn || 0,
      label: "Overdue Return",
      color: "text-red-700",
    },
  ];

  const lifecycleCards = [
    {
      icon: <CheckCircle className="w-7 h-7 text-emerald-600" />,
      bg: "bg-emerald-100",
      value: summary.working || 0,
      label: "Working",
      color: "text-emerald-600",
    },
    {
      icon: <AlertTriangle className="w-7 h-7 text-rose-600" />,
      bg: "bg-rose-100",
      value: summary.notWorking || 0,
      label: "Not Working",
      color: "text-rose-600",
    },
    {
      icon: <Wrench className="w-7 h-7 text-orange-600" />,
      bg: "bg-orange-100",
      value: summary.underRepair || 0,
      label: "Under Repair",
      color: "text-orange-600",
    },
    {
      icon: <RotateCcw className="w-7 h-7 text-yellow-600" />,
      bg: "bg-yellow-100",
      value: summary.forRedeployment || 0,
      label: "For Redeployment",
      color: "text-yellow-600",
    },
    {
      icon: <Archive className="w-7 h-7 text-slate-700" />,
      bg: "bg-slate-200",
      value: summary.retired || 0,
      label: "Retired",
      color: "text-slate-700",
    },
  ];

  const warrantyCards = [
    {
      icon: <ShieldCheck className="w-7 h-7 text-blue-600" />,
      bg: "bg-blue-100",
      value: summary.inWarranty || 0,
      label: "In Warranty",
      color: "text-blue-600",
    },
    {
      icon: <Clock3 className="w-7 h-7 text-orange-600" />,
      bg: "bg-orange-100",
      value: summary.expiringSoon || 0,
      label: "Expiring Soon",
      color: "text-orange-600",
    },
    {
      icon: <ShieldAlert className="w-7 h-7 text-rose-600" />,
      bg: "bg-rose-100",
      value: summary.warrantyExpired || 0,
      label: "Warranty Expired",
      color: "text-rose-600",
    },
  ];

  const renderCards = (cards, options = {}) => {
    const { centerThreeOnXl = false } = options;

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((card, i) => {
          const specialStartClass =
            centerThreeOnXl && cards.length === 3 && i === 0
              ? "xl:col-start-2"
              : "";

          return (
            <div
              key={i}
              className={`bg-white rounded-2xl border border-slate-200 px-5 py-5 flex flex-col items-center text-center gap-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 min-h-[138px] ${specialStartClass}`}
            >
              <div className={`text-3xl font-bold leading-none ${card.color}`}>
                {card.value}
              </div>

              <div
                className={`w-12 h-12 ${card.bg} rounded-2xl flex items-center justify-center shrink-0`}
              >
                <div className="scale-90">{card.icon}</div>
              </div>

              <p className="text-sm font-medium text-slate-600 leading-snug">
                {card.label}
              </p>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <p className="text-sm font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="w-full max-w-none space-y-10 px-6 py-8 lg:px-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Asset Dashboard
            </h1>
            <p className="text-slate-500 mt-1">
              Overview of your IT inventory • {summary.totalAssets || 0} total assets
            </p>
          </div>

          <Button
            onClick={loadData}
            variant="ghost"
            className="text-slate-500 hover:text-slate-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="space-y-8">
          <div className="space-y-3">
            {renderCards(primaryCards)}
          </div>

          <div className="space-y-3">
            {renderCards(lifecycleCards)}
          </div>

          <div className="space-y-3">
            {renderCards(warrantyCards, { centerThreeOnXl: true })}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <DashboardCharts
            laptops={totalLaptops}
            desktops={totalDesktops}
            printers={totalPrinters}
            working={summary.working || 0}
            notWorking={summary.notWorking || 0}
            forRedeployment={summary.forRedeployment || 0}
            departmentCounts={departmentCounts || {}}
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <Button
            onClick={() => {
              setEditAsset(null);
              setShowForm(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm px-6 py-6 rounded-2xl text-base font-medium"
          >
            <Plus className="w-5 h-5 mr-3" />
            Add New Asset
          </Button>
        </div>

        {showForm && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
            <AssetForm
              asset={editAsset}
              onSaved={handleSaved}
              onCancel={() => {
                setShowForm(false);
                setEditAsset(null);
              }}
            />
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Recent Assets</h2>
            <p className="text-sm text-slate-500">
              Showing {Math.min(15, allItems.length)} of {allItems.length} assets
            </p>
          </div>

          <AssetTable
            assets={allItems.slice(0, 15)}
            onEdit={handleEdit}
            onDeleted={loadData}
          />
        </div>
      </div>
    </div>
  );
}