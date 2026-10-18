import type { ForecastRow } from "@/lib/forecast";
import { monthLabel } from "@/lib/dates";
import { fmt } from "@/lib/format";

/** Month-end balance line, drawn right-to-left to match the RTL page. */
export function ForecastChart({ rows, start, compact }: { rows: ForecastRow[]; start: number; compact?: boolean }) {
  const W = 600;
  const H = compact ? 110 : 180;
  const PAD = 8;
  const values = [start, ...rows.map((r) => r.closing)];
  const min = Math.min(...values, 0);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (i: number) => W - PAD - (i * (W - PAD * 2)) / (values.length - 1);
  const y = (v: number) => H - PAD - ((v - min) / span) * (H - PAD * 2);
  const path = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const zeroY = y(0);
  const last = values.length - 1;

  return (
    <div className="space-y-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="תחזית יתרה">
        <defs>
          <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {min < 0 && <line x1={PAD} x2={W - PAD} y1={zeroY} y2={zeroY} stroke="#3f3f46" strokeDasharray="4 4" />}
        <path d={`${path} L${x(last)},${H - PAD} L${x(0)},${H - PAD} Z`} fill="url(#fill)" />
        <path d={path} fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {!compact &&
          values.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r={2.5} fill={v < 0 ? "#a1a1aa" : "#fff"} />)}
        <circle cx={x(last)} cy={y(values[last])} r={4.5} fill="#fff" />
      </svg>
      {!compact && (
        <div className="flex justify-between text-xs text-zinc-500">
          <span>היום · <span className="num">{fmt(start)}</span></span>
          <span>
            {monthLabel(rows[rows.length - 1].month)} · <span className="num text-white">{fmt(rows[rows.length - 1].closing)}</span>
          </span>
        </div>
      )}
    </div>
  );
}
