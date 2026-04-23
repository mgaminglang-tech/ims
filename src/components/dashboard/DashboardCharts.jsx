import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
} from "recharts";

const COLORS = [
  "#2563eb",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#f97316",
];

export default function DashboardCharts({
  laptops = 0,
  desktops = 0,
  printers = 0,
  working = 0,
  notWorking = 0,
  forRedeployment = 0,
  departmentCounts = {},
}) {
  const typeData = [
    { name: "Laptop", value: Number(laptops || 0), fill: "#2563eb" },
    { name: "Desktop", value: Number(desktops || 0), fill: "#6366f1" },
    { name: "Printer", value: Number(printers || 0), fill: "#8b5cf6" },
  ].filter((d) => d.value > 0);

  const normalizedDepartmentData = Array.isArray(departmentCounts)
    ? departmentCounts.map((item, index) => ({
        name:
          String(item.department || item.name || "Unassigned").trim().length > 18
            ? String(item.department || item.name || "Unassigned")
                .trim()
                .replace(" - ", " -\n")
            : String(item.department || item.name || "Unassigned").trim(),
        value: Number(item.total || item.value || 0),
        fill: COLORS[index % COLORS.length],
      }))
    : Object.entries(departmentCounts || {}).map(([name, value], index) => ({
        name:
          String(name).trim().length > 18
            ? String(name).trim().replace(" - ", " -\n")
            : String(name).trim(),
        value: Number(value || 0),
        fill: COLORS[index % COLORS.length],
      }));

  const departmentData = normalizedDepartmentData
    .filter((item) => item.name && item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      <div className="xl:col-span-4 bg-white rounded-2xl shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Asset Distribution</h3>

        <div className="h-[300px]">
          {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="46%"
                  innerRadius={72}
                  outerRadius={108}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-type-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}`, "Count"]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              No asset type data
            </div>
          )}
        </div>

        <div className="flex justify-center gap-6 mt-2 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#2563eb] rounded-full"></div>
            Laptop ({laptops || 0})
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#6366f1] rounded-full"></div>
            Desktop ({desktops || 0})
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#8b5cf6] rounded-full"></div>
            Printer ({printers || 0})
          </div>
        </div>
      </div>

      <div className="xl:col-span-8 bg-white rounded-2xl shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Assets by Department</h3>

        <div className="h-[300px]">
          {departmentData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={departmentData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 30, bottom: 8 }}
                barCategoryGap={24}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#e5e7eb"
                />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={125}
                  tick={{ fontSize: 12, fill: "#475569" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip formatter={(value) => [`${value}`, "Assets"]} />
                <Bar dataKey="value" radius={[6, 6, 6, 6]}>
                  <LabelList
                    dataKey="value"
                    position="right"
                    style={{ fill: "#0f172a", fontSize: 12, fontWeight: 700 }}
                  />
                  {departmentData.map((entry, index) => (
                    <Cell
                      key={`cell-dept-${index}`}
                      fill={entry.fill || COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              No department data
            </div>
          )}
        </div>
      </div>
    </div>
  );
}