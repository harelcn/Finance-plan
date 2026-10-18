import Link from "next/link";
import { fmt } from "@/lib/format";
import { Icon, type IconName } from "./Icon";

export function Card({ title, aside, children, className = "" }: { title?: string; aside?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`bg-zinc-900/60 border border-white/5 rounded-2xl p-5 space-y-4 ${className}`}>
      {(title || aside) && (
        <div className="flex items-baseline justify-between gap-3">
          {title && <h2 className="text-[13px] font-medium text-zinc-300">{title}</h2>}
          {aside && <div className="text-xs text-zinc-500">{aside}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="pt-1">
      <h1 className="text-2xl font-light">{title}</h1>
      {subtitle && <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>}
    </div>
  );
}

/** Big amount: ₪ small, integer light and large. */
export function Amount({ value, size = "text-4xl" }: { value: number; size?: string }) {
  const r = Math.round(value);
  return (
    <span className={`num inline-flex items-baseline gap-1 font-light tracking-tight ${size}`}>
      {r < 0 && <span>−</span>}
      <span className="text-[0.5em] text-zinc-400 font-normal">₪</span>
      {Math.abs(r).toLocaleString("he-IL")}
    </span>
  );
}

export function ProgressBar({ pct, danger }: { pct: number; danger?: boolean }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${danger ? "bg-zinc-500" : "bg-white"}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}

/** "label ........ ₪actual / ₪target (pct%)" with a bar under it. */
export function TargetBar({ label, actual, target, invert }: { label: string; actual: number; target: number; invert?: boolean }) {
  const p = target > 0 ? (actual / target) * 100 : 0;
  const over = invert ? actual > target : actual >= target;
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline text-xs gap-2">
        <span className="text-zinc-400">{label}</span>
        <span className={over ? "text-white" : "text-zinc-400"}>
          <span className="num">{fmt(actual)} / {fmt(target)}</span>
          <span className="text-zinc-500"> · {p.toFixed(1)}%</span>
        </span>
      </div>
      <ProgressBar pct={p} danger={invert && over} />
    </div>
  );
}

export function Line({ label, value, muted, strong }: { label: React.ReactNode; value: number | string; muted?: boolean; strong?: boolean }) {
  return (
    <div className={`flex justify-between text-sm ${muted ? "text-zinc-400" : ""} ${strong ? "text-white font-medium" : ""}`}>
      <span>{label}</span>
      <span className="num">{typeof value === "number" ? fmt(value) : value}</span>
    </div>
  );
}

/** Bank-style list row: icon bubble, title + subtitle, amount on the left. */
export function Row({ icon, title, subtitle, amount, amountNote, action, done }: {
  icon: IconName; title: string; subtitle?: string; amount: number; amountNote?: string; action?: React.ReactNode;
  /** Fully settled: greyed out with a strike-through. */
  done?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 py-3 ${done ? "opacity-40 [&_.strike]:line-through" : ""}`}>
      <span className="w-10 h-10 shrink-0 grid place-items-center rounded-full bg-white/5 text-zinc-300">
        <Icon name={icon} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="strike block text-sm truncate">{title}</span>
        {subtitle && <span className="block text-xs text-zinc-500 truncate">{subtitle}</span>}
      </span>
      <span className="text-left">
        <span className="strike block text-sm num">{fmt(amount)}</span>
        {amountNote && <span className="block text-[11px] text-zinc-500">{amountNote}</span>}
      </span>
      {action}
    </div>
  );
}

export function RowList({ children, empty }: { children: React.ReactNode; empty?: string }) {
  const has = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return has ? <div className="divide-y divide-white/5 -my-3">{children}</div> : <p className="text-xs text-zinc-600">{empty ?? "אין עדיין"}</p>;
}

export function QuickAction({ href, icon, label }: { href: string; icon: IconName; label: string }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-2 group">
      <span className="w-14 h-14 grid place-items-center rounded-2xl bg-zinc-900 border border-white/5 text-zinc-200 group-hover:bg-zinc-800 group-active:scale-95 transition">
        <Icon name={icon} className="w-6 h-6" />
      </span>
      <span className="text-[11px] text-zinc-400 text-center leading-tight">{label}</span>
    </Link>
  );
}

export function MoreLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white">
      {children}
      <Icon name="chevron" className="w-3.5 h-3.5" />
    </Link>
  );
}
