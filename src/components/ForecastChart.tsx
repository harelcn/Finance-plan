import type { ForecastRow } from "@/lib/forecast";
import { monthLabel } from "@/lib/dates";
import { fmt } from "@/lib/format";

/** Month-end balance line, drawn right-to-left to match the RTL page. */
export function ForecastChart({ rows, start }: { rows: ForecastRow[]; start: number }) {
  const W = 600;
  const H = 180;
  const PAD = 8;
  const values = [start, ...rows.map((r) => r.closing)];
  const min = Math.min(...values, 0);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (i: number) => W - PAD - (i * (W - PAD * 2)) / (values.length - 1);
  const y = (v: number) => H - PAD - ((v - min) / span) * (H - PAD * 2);
  const path = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const zeroY = y(0);

  return (
    <div className="space-y-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="תחזית יתרה">
        {min < 0 && <line x1={PAD} x2={W - PAD} y1={zeroY} y2={zeroY} stroke="#3f3f46" strokeDasharray="4 4" />}
        <path d={`${path} L${x(values.length - 1)},${H - PAD} L${x(0)},${H - PAD} Z`} fill="#ffffff" opacity="0.05" />
        <path d={path} fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
        {values.map((v, i) => (
          <circle key={i} cx={x(i)} cy={y(v)} r={i === values.length - 1 ? 4 : 2.5} fill={v < 0 ? "#a1a1aa" : "#fff"} />
        ))}
      </svg>
      <div className="flex justify-between text-xs text-zinc-500">
        <span>היום · <span className="num">{fmt(start)}</span></span>
        <span>
          {monthLabel(rows[rows.length - 1].month)} · <span className="num text-white">{fmt(rows[rows.length - 1].closing)}</span>
        </span>
      </div>
    </div>
  );
}
