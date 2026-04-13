import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["#2563eb", "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444", "#f97316"];

export default function DashboardCharts({ assets }) {
  // Asset type distribution
  const typeData = [
    { name: "Laptop", value: assets.filter(a => a.asset_type === "Laptop").length },
    { name: "Desktop", value: assets.filter(a => a.asset_type === "Desktop").length },
    { name: "Printer", value: assets.filter(a => a.asset_type === "Printer").length },
  ].filter(d => d.value > 0);

  // Status distribution
  const statusData = [
    { name: "Working", value: assets.filter(a => a.status === "WORKING").length },
    { name: "Not Working", value: assets.filter(a => a.status === "NOT WORKING").length },
    { name: "Defective", value: assets.filter(a => a.status === "DEFECTIVE").length },
    { name: "Re-Deploy", value: assets.filter(a => a.status === "FOR RE-DEPLOYMENT").length },
    { name: "Disposal", value: assets.filter(a => a.status === "FOR DISPOSAL").length },
  ].filter(d => d.value > 0);

  // Department distribution
  const deptMap = {};
  assets.forEach(a => {
    const dept = a.department || "Unassigned";
    deptMap[dept] = (deptMap[dept] || 0) + 1;
  });
  const deptData = Object.entries(deptMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Asset Type Pie */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 px-1">By Asset Type</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={typeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
              {typeData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.1)' }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Status Pie */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 px-1">By Status</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
              {statusData.map((_, i) => <Cell key={i} fill={COLORS[i + 3]} />)}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.1)' }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Department Bar */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 px-1">By Department</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={deptData} layout="vertical" margin={{ left: 0, right: 10 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.1)' }} />
            <Bar dataKey="value" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={14} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}