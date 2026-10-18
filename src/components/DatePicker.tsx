"use client";
import { useMemo, useState } from "react";
import { addMonths, dateLabel, monthEnd, ymOf } from "@/lib/dates";
import { balanceAt, type ForecastInput } from "@/lib/forecast";
import { fmt } from "@/lib/format";
import { Line } from "./ui";

export function DatePicker({ input }: { input: ForecastInput }) {
  const thisYm = ymOf(input.today);
  const presets = [
    { label: "סוף החודש", date: monthEnd(thisYm) },
    { label: "3 חודשים", date: monthEnd(addMonths(thisYm, 3)) },
    { label: "6 חודשים", date: monthEnd(addMonths(thisYm, 6)) },
    { label: "סוף השנה", date: `${thisYm.slice(0, 4)}-12-31` },
    { label: "שנה", date: monthEnd(addMonths(thisYm, 12)) },
  ];
  const [date, setDate] = useState(presets[2].date);
  const r = useMemo(() => balanceAt(input, date), [input, date]);
  const change = r.balance - input.currentBalance;

  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-sm">כמה יהיה לי ב־</h2>
        <input
          type="date"
          value={date}
          min={input.today}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          className="bg-black border border-zinc-700 rounded-lg px-3 py-1.5 text-sm"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => setDate(p.date)}
            className={`text-xs px-3 py-1 rounded-full border ${
              p.date === date ? "border-white text-white" : "border-zinc-700 text-zinc-500"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div>
        <p className="text-xs text-zinc-500">{dateLabel(date)}</p>
        <p className="text-4xl num text-right">{fmt(r.balance)}</p>
        <p className={`text-xs mt-1 ${change >= 0 ? "text-zinc-400" : "text-zinc-300"}`}>
          <span className="num">{change >= 0 ? "+" : ""}{fmt(change)}</span> מהיום
        </p>
      </div>

      <div className="space-y-1.5 border-t border-zinc-800 pt-3">
        <Line label="היום" value={input.currentBalance} muted />
        <Line label="+ הכנסות צפויות (לפי יעד)" value={r.income} muted />
        <Line label="− הוצאות שוטפות (לפי יעד)" value={-r.variableExpenses} muted />
        {r.standing > 0 && <Line label="− הוראות קבע" value={-r.standing} muted />}
        {r.planned > 0 && <Line label="− הוצאות מתוכננות" value={-r.planned} muted />}
      </div>

      {r.events.some((e) => e.kind === "planned") && (
        <div className="space-y-1 text-xs text-zinc-500">
          {r.events
            .filter((e) => e.kind === "planned")
            .map((e, i) => (
              <div key={i} className="flex justify-between">
                <span>
                  {e.name}
                  {e.installment && ` (${e.installment.index}/${e.installment.of})`} · {dateLabel(e.date)}
                </span>
                <span className="num">{fmt(-e.amount)}</span>
              </div>
            ))}
        </div>
      )}
    </section>
  );
}
