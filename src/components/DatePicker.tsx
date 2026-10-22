"use client";
import { useMemo, useState } from "react";
import { addMonths, dateLabel, monthEnd, ymOf } from "@/lib/dates";
import { balanceAt, type ForecastInput } from "@/lib/forecast";
import { fmt } from "@/lib/format";
import { Amount, Line } from "./ui";

export function DatePicker({ input }: { input: ForecastInput }) {
  const thisYm = ymOf(input.today);
  const presets = [
    { label: "סוף החודש", date: monthEnd(thisYm) },
    { label: "3 חודשים", date: monthEnd(addMonths(thisYm, 3)) },
    { label: "חצי שנה", date: monthEnd(addMonths(thisYm, 6)) },
    { label: "סוף השנה", date: `${thisYm.slice(0, 4)}-12-31` },
    { label: "שנה", date: monthEnd(addMonths(thisYm, 12)) },
  ];
  const [date, setDate] = useState(presets[2].date);
  const r = useMemo(() => balanceAt(input, date), [input, date]);
  const change = r.balance - input.currentBalance;

  return (
    <section className="hero rounded-3xl p-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted">יתרה צפויה ב־</span>
        <input
          type="date"
          value={date}
          min={input.today}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          className="bg-chip/10 border border-line rounded-full px-3 py-1.5 text-xs"
        />
      </div>

      <div>
        <Amount value={r.balance} size="text-5xl" />
        <p className="text-xs text-muted mt-2">
          {dateLabel(date)} · <span className="num">{change >= 0 ? "+" : ""}{fmt(change)}</span> מהיום
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => setDate(p.date)}
            className={`shrink-0 text-xs px-3.5 py-1.5 rounded-full transition ${
              p.date === date ? "bg-brand text-onbrand" : "bg-subtle text-ink hover:bg-line"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="space-y-2 border-t border-line pt-4">
        <Line label="יתרה היום" value={input.currentBalance} muted />
        <Line label="הכנסות צפויות" value={r.income} muted />
        <Line label="הוצאות שוטפות" value={-r.variableExpenses} muted />
        {r.standing > 0 && <Line label="הוראות קבע" value={-r.standing} muted />}
        {r.planned > 0 && <Line label="הוצאות מתוכננות" value={-r.planned} muted />}
      </div>

      {r.events.some((e) => e.kind === "planned") && (
        <div className="space-y-1.5 text-xs text-muted">
          {r.events
            .filter((e) => e.kind === "planned")
            .map((e, i) => (
              <div key={i} className="flex justify-between">
                <span>
                  {e.name}
                  {e.installment && ` (${e.installment.index}/${e.installment.of})`} · {e.date <= input.today ? "טרם יצא" : dateLabel(e.date)}
                </span>
                <span className="num">{fmt(-e.due)}</span>
              </div>
            ))}
        </div>
      )}
    </section>
  );
}
