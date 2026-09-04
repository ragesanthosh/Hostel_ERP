export default function OccupancyBar({ label, occupied, total, showPercent = true }) {
  const percent = total > 0 ? Math.round((occupied / total) * 100) : 0;
  const color =
    percent >= 90 ? 'bg-rose-500' : percent >= 70 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
        <span className="text-slate-500 dark:text-slate-400">
          {occupied} / {total}
          {showPercent && <span className="ml-2 font-medium text-slate-700 dark:text-slate-300">{percent}%</span>}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}
