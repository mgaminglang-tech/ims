export default function StatCard({
  label,
  value,
  icon: Icon,
  color = "bg-primary",
}) {
  return (
    <div className="group bg-white rounded-3xl border border-slate-100 px-5 py-4 flex flex-col items-center text-center hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 min-h-[130px]">
      <p className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 leading-none">
        {value}
      </p>

      <div
        className={`mt-3 w-12 h-12 rounded-2xl ${color} flex items-center justify-center flex-shrink-0 shadow-sm`}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>

      <p className="mt-3 text-sm font-medium text-slate-500 leading-snug">
        {label}
      </p>
    </div>
  );
}