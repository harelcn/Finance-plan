import { fmt } from "@/lib/format";

export function Card({ title, aside, children }: { title?: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
      {(title || aside) && (
        <div className="flex items-baseline justify-between gap-3">
          {title && <h2 className="text-sm">{title}</h2>}
          {aside && <div className="text-xs text-zinc-500">{aside}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function ProgressBar({ pct, danger }: { pct: number; danger?: boolean }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${danger ? "bg-zinc-400" : "bg-white"}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

/** "label ........ ₪actual / ₪target (pct%)" with a bar under it. */
export function TargetBar({ label, actual, target, invert }: { label: string; actual: number; target: number; invert?: boolean }) {
  const p = target > 0 ? (actual / target) * 100 : 0;
  const over = invert ? actual > target : actual >= target;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs gap-2">
        <span className="text-zinc-500">{label}</span>
        <span className={over ? "text-white" : "text-zinc-400"}>
          <span className="num">{fmt(actual)} / {fmt(target)}</span> ({p.toFixed(1)}%)
        </span>
      </div>
      <ProgressBar pct={p} danger={invert && over} />
    </div>
  );
}

export function Line({ label, value, muted, strong }: { label: React.ReactNode; value: number | string; muted?: boolean; strong?: boolean }) {
  return (
    <div className={`flex justify-between text-sm ${muted ? "text-zinc-500" : ""} ${strong ? "text-white" : ""}`}>
      <span>{label}</span>
      <span className="num">{typeof value === "number" ? fmt(value) : value}</span>
    </div>
  );
}
