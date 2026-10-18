import Link from "next/link";
import { fmt } from "@/lib/format";
import { Icon, type IconName } from "./Icon";

/** Green band (default, shade deepens down the page) or a white "paper" card for alerts. */
export function Card({ title, aside, children, className = "", paper }: {
  title?: string; aside?: React.ReactNode; children: React.ReactNode; className?: string; paper?: boolean;
}) {
  const skin = paper ? "paper bg-surface shadow-[0_8px_24px_-12px_rgba(0,0,0,0.35)]" : "band";
  return (
    <section className={`${skin} rounded-3xl p-5 space-y-4 ${className}`}>
      {(title || aside) && (
        <div className="flex items-baseline justify-between gap-3">
          {title && <h2 className="text-sm font-medium text-ink">{title}</h2>}
          {aside && <div className="text-xs text-muted">{aside}</div>}
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
      {subtitle && <p className="text-xs text-muted mt-1">{subtitle}</p>}
    </div>
  );
}

/** Bank-style amount: small ₪, large light integer, small agorot. */
export function Amount({ value, size = "text-4xl" }: { value: number; size?: string }) {
  const [int, dec] = Math.abs(value).toFixed(2).split(".");
  return (
    <span className={`num inline-flex items-baseline gap-0.5 font-light tracking-tight ${size}`}>
      {value < 0 && <span>−</span>}
      <span className="text-[0.42em] font-normal me-0.5">₪</span>
      {Number(int).toLocaleString("he-IL")}
      <span className="text-[0.42em] font-normal">.{dec}</span>
    </span>
  );
}

export function ProgressBar({ pct, danger }: { pct: number; danger?: boolean }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="w-full h-1.5 bg-ink/20 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${danger ? "bg-danger" : "bg-brand"}`} style={{ width: `${clamped}%` }} />
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
        <span className="text-muted">{label}</span>
        <span className={over ? (invert ? "text-danger font-medium" : "text-ink font-medium") : "text-muted"}>
          <span className="num">{fmt(actual)} / {fmt(target)}</span>
          <span className="text-muted"> · {p.toFixed(1)}%</span>
        </span>
      </div>
      <ProgressBar pct={p} danger={invert && over} />
    </div>
  );
}

export function Line({ label, value, muted, strong }: { label: React.ReactNode; value: number | string; muted?: boolean; strong?: boolean }) {
  return (
    <div className={`flex justify-between text-sm ${muted ? "text-muted" : ""} ${strong ? "text-ink font-medium" : ""}`}>
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
      <span className="w-10 h-10 shrink-0 grid place-items-center rounded-full bg-ink/10 text-ink">
        <Icon name={icon} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="strike block text-sm truncate">{title}</span>
        {subtitle && <span className="block text-xs text-muted truncate">{subtitle}</span>}
      </span>
      <span className="text-left">
        <span className="strike block text-sm num">{fmt(amount)}</span>
        {amountNote && <span className="block text-[11px] text-muted">{amountNote}</span>}
      </span>
      {action}
    </div>
  );
}

export function RowList({ children, empty }: { children: React.ReactNode; empty?: string }) {
  const has = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return has ? <div className="divide-y divide-ink/10 -my-3">{children}</div> : <p className="text-xs text-faint">{empty ?? "אין עדיין"}</p>;
}

export function QuickAction({ href, icon, label }: { href: string; icon: IconName; label: string }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-2 group">
      <span className="w-14 h-14 grid place-items-center rounded-2xl bg-chip/15 text-ink group-hover:bg-chip/25 group-active:scale-95 transition">
        <Icon name={icon} className="w-6 h-6" />
      </span>
      <span className="text-[11px] text-ink text-center leading-tight">{label}</span>
    </Link>
  );
}

export function MoreLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-1 text-xs text-ink font-medium hover:opacity-80">
      {children}
      <Icon name="chevron" className="w-3.5 h-3.5" />
    </Link>
  );
}
