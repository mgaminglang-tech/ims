import { Monitor, Laptop, Printer, CheckCircle, AlertTriangle, RotateCcw, ShieldAlert, Package } from "lucide-react";
import StatCard from "./StatCard";

export default function StatsGrid({ assets }) {
  const total = assets.length;
  const laptops = assets.filter(a => a.asset_type === "Laptop").length;
  const desktops = assets.filter(a => a.asset_type === "Desktop").length;
  const printers = assets.filter(a => a.asset_type === "Printer").length;
  const working = assets.filter(a => a.status === "WORKING").length;
  const defective = assets.filter(a => a.status === "DEFECTIVE" || a.status === "NOT WORKING").length;
  const redeployment = assets.filter(a => a.status === "FOR RE-DEPLOYMENT").length;
  
  const today = new Date();
  const expiredWarranty = assets.filter(a => {
    if (!a.warranty_end) return false;
    return new Date(a.warranty_end) < today;
  }).length;

  const stats = [
    { label: "Total Assets", value: total, icon: Package, color: "bg-slate-800" },
    { label: "Laptops", value: laptops, icon: Laptop, color: "bg-blue-600" },
    { label: "Desktops", value: desktops, icon: Monitor, color: "bg-indigo-600" },
    { label: "Printers", value: printers, icon: Printer, color: "bg-violet-600" },
    { label: "Working", value: working, icon: CheckCircle, color: "bg-emerald-600" },
    { label: "Defective", value: defective, icon: AlertTriangle, color: "bg-red-600" },
    { label: "For Re-Deploy", value: redeployment, icon: RotateCcw, color: "bg-amber-600" },
    { label: "Expired Warranty", value: expiredWarranty, icon: ShieldAlert, color: "bg-orange-600" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((s) => (
        <StatCard key={s.label} {...s} />
      ))}
    </div>
  );
}