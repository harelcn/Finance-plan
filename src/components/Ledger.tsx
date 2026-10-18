"use client";
import { useMemo, useState } from "react";
import { dateLabel, monthLabel, ymOf } from "@/lib/dates";
import { fmt } from "@/lib/format";
import type { ExpenseRow, IncomeRow } from "@/lib/types";
import { Amount, Card, ProgressBar, Row, RowList } from "./ui";

const ALL = "all";

/** Month chips (newest first) + "הכל". */
function useMonths<T extends { date: string }>(rows: T[], today: string) {
  const months = useMemo(() => {
    const set = new Set(rows.map((r) => ymOf(r.date)));
    set.add(ymOf(today));
    return [...set].sort().reverse();
  }, [rows, today]);
  const [month, setMonth] = useState(ymOf(today));
  const shown = month === ALL ? rows : rows.filter((r) => ymOf(r.date) === month);
  return { months, month, setMonth, shown };
}

function MonthChips({ months, month, setMonth }: { months: string[]; month: string; setMonth: (m: string) => void }) {
  const chip = (active: boolean) =>
    `shrink-0 text-xs px-3.5 py-1.5 rounded-full transition ${active ? "bg-brand text-onbrand font-medium" : "bg-ink/10 text-ink hover:bg-ink/20"}`;
  return (
    <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
      {months.map((m) => (
        <button key={m} onClick={() => setMonth(m)} className={chip(m === month)}>
          {monthLabel(m)}
        </button>
      ))}
      <button onClick={() => setMonth(ALL)} className={chip(month === ALL)}>
        הכל
      </button>
    </div>
  );
}

function Total({ label, total, count }: { label: string; total: number; count: number }) {
  return (
    <section className="hero space-y-1 py-1">
      <p className="text-xs text-muted">{label}</p>
      <Amount value={total} size="text-4xl" />
      <p className="text-[11px] text-muted">{count} רשומות</p>
    </section>
  );
}

export function ExpensesView({ rows, today }: { rows: ExpenseRow[]; today: string }) {
  const { months, month, setMonth, shown } = useMonths(rows, today);
  const total = shown.reduce((s, r) => s + r.amount, 0);
  const byCategory = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of shown) m.set(r.category || "ללא קטגוריה", (m.get(r.category || "ללא קטגוריה") ?? 0) + r.amount);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [shown]);

  return (
    <>
      <MonthChips months={months} month={month} setMonth={setMonth} />
      <Total label={month === ALL ? "סה״כ הוצאות" : `הוצאות ${monthLabel(month)}`} total={total} count={shown.length} />

      {byCategory.length > 0 && (
        <Card title="לפי קטגוריה">
          <div className="space-y-3">
            {byCategory.map(([name, amount]) => (
              <div key={name} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span>{name}</span>
                  <span className="num">
                    {fmt(amount)} <span className="text-muted">· {total > 0 ? ((amount / total) * 100).toFixed(0) : 0}%</span>
                  </span>
                </div>
                <ProgressBar pct={total > 0 ? (amount / total) * 100 : 0} />
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title="הוצאות">
        <RowList empty="אין הוצאות בחודש הזה">
          {shown.map((r) => (
            <Row
              key={r.id}
              icon={r.planned ? "calendar" : "wallet"}
              title={r.name || "ללא שם"}
              subtitle={[dateLabel(r.date), r.category, r.planned ? "מתוכנן" : ""].filter(Boolean).join(" · ")}
              amount={-r.amount}
            />
          ))}
        </RowList>
      </Card>
    </>
  );
}

const STATUS_STYLE: Record<string, string> = {
  "שולם": "bg-chip/25 text-ink",
  "שולם חלקית": "bg-chip/15 text-ink",
  "לא שולם": "bg-danger/25 text-ink",
};

export function IncomeView({ payments, closings, today }: { payments: IncomeRow[]; closings: IncomeRow[]; today: string }) {
  const [tab, setTab] = useState<"payments" | "closings">("payments");
  const rows = tab === "payments" ? payments : closings;
  const { months, month, setMonth, shown } = useMonths(rows, today);
  const total = shown.reduce((s, r) => s + r.amount, 0);
  const seg = (active: boolean) =>
    `flex-1 py-2.5 rounded-full text-sm transition ${active ? "bg-white text-[rgb(62_150_52)] font-medium shadow-sm" : "text-ink"}`;

  return (
    <>
      <div className="flex p-1 rounded-full bg-ink/15">
        <button onClick={() => setTab("payments")} className={seg(tab === "payments")}>הכנסות</button>
        <button onClick={() => setTab("closings")} className={seg(tab === "closings")}>סגירות</button>
      </div>

      <MonthChips months={months} month={month} setMonth={setMonth} />
      <Total
        label={`${tab === "payments" ? "נכנס" : "נסגר"}${month === ALL ? " בסה״כ" : ` ב${monthLabel(month)}`}`}
        total={total}
        count={shown.length}
      />

      <Card title={tab === "payments" ? "הכנסות" : "סגירות"}>
        <RowList empty={tab === "payments" ? "אין הכנסות בחודש הזה" : "אין סגירות בחודש הזה"}>
          {shown.map((r) => (
            <div key={r.id} className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <Row
                  icon={tab === "payments" ? "chart" : "target"}
                  title={r.name || "ללא שם"}
                  subtitle={[r.client, dateLabel(r.date)].filter(Boolean).join(" · ")}
                  amount={r.amount}
                />
              </div>
              {r.status && (
                <span className={`shrink-0 text-[10px] px-2 py-1 rounded-full ${STATUS_STYLE[r.status] ?? "bg-ink/10"}`}>{r.status}</span>
              )}
            </div>
          ))}
        </RowList>
      </Card>
    </>
  );
}
