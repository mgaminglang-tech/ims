import {
  Monitor,
  Laptop,
  Printer,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
  Package,
} from "lucide-react";
import StatCard from "./StatCard";

export default function StatsGrid({ 
  assets = [], 
  totalLaptops = 0, 
  totalDesktops = 0, 
  totalPrinters = 0 
}) {
  
  const total = assets.length;

  const laptops = totalLaptops;
  const desktops = totalDesktops;
  const printers = totalPrinters;

  const fallbackLaptops = assets.filter((a) => 
    String(a.asset_type || "").toUpperCase() === "LAPTOP"
  ).length;

  const fallbackDesktops = assets.filter((a) => 
    String(a.asset_type || "").toUpperCase() === "DESKTOP"
  ).length;

  const fallbackPrinters = assets.filter((a) => 
    String(a.asset_type || "").toUpperCase() === "PRINTER"
  ).length;

  const finalLaptops = laptops || fallbackLaptops;
  const finalDesktops = desktops || fallbackDesktops;
  const finalPrinters = printers || fallbackPrinters;

  const working = assets.filter((a) => 
    ["ACTIVE", "WORKING"].includes(String(a.condition || a.status || "").toUpperCase())
  ).length;

  const defective = assets.filter((a) => 
    ["DEFECTIVE", "NOT WORKING", "INACTIVE"].includes(String(a.condition || a.status || "").toUpperCase())
  ).length;

  const redeployment = assets.filter((a) => 
    String(a.condition || "").toUpperCase().includes("RE-DEPLOY")
  ).length;

  const today = new Date();
  const expiredWarranty = assets.filter((a) => {
    if (!a.warranty_end) return false;
    return new Date(a.warranty_end) < today;
  }).length;

  const stats = [
    { label: "TOTAL ASSETS", value: total, icon: Package, color: "bg-slate-800" },
    { label: "LAPTOPS", value: finalLaptops, icon: Laptop, color: "bg-blue-600" },
    { label: "DESKTOPS", value: finalDesktops, icon: Monitor, color: "bg-indigo-600" },
    { label: "PRINTERS", value: finalPrinters, icon: Printer, color: "bg-violet-600" },
    { label: "WORKING", value: working, icon: CheckCircle, color: "bg-emerald-600" },
    { label: "DEFECTIVE", value: defective, icon: AlertTriangle, color: "bg-red-600" },
    { label: "FOR RE-DEPLOY", value: redeployment, icon: RotateCcw, color: "bg-amber-600" },
    { label: "EXPIRED WARRANTY", value: expiredWarranty, icon: ShieldAlert, color: "bg-orange-600" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6">
      {stats.map((s, index) => (
        <StatCard 
          key={s.label} 
          {...s} 
          className={`
            transition-all duration-300 hover:-translate-y-1 hover:shadow-lg
            ${index === 0 ? 'col-span-2 sm:col-span-3 lg:col-span-1' : ''}
          `}
        />
      ))}
    </div>
  );
}