import { DatePicker } from "@/components/DatePicker";
import { ForecastChart } from "@/components/ForecastChart";
import { DeleteButton, PlannedForm, StandingForm, TargetForm } from "@/components/Forms";
import { Card, Line, TargetBar } from "@/components/ui";
import { FORECAST_MONTHS, TRACKING_START } from "@/lib/config";
import { addMonths, dateLabel, monthLabel, ymOf } from "@/lib/dates";
import { forecastMonths, planMonth, tracking, type ForecastInput } from "@/lib/forecast";
import { fmt, signed, todayIL } from "@/lib/format";
import { getActuals } from "@/lib/notion";
import { getPlan } from "@/lib/plan-store";

export const dynamic = "force-dynamic";

export default async function Page() {
  const today = todayIL();
  const [actuals, plan] = await Promise.all([getActuals(), getPlan()]);
  const input: ForecastInput = { ...plan, today, currentBalance: actuals.balance.total, actuals: actuals.monthly };

  const rows = forecastMonths(input, FORECAST_MONTHS);
  const track = tracking(input, TRACKING_START);
  const now = planMonth(input, ymOf(today));
  const b = actuals.balance;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <header className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <h1 className="text-xl tracking-tight">תכנון פיננסי</h1>
        <span className="text-xs text-zinc-500">{dateLabel(today)}</span>
      </header>

      {/* ───── Current balance, rebuilt from Notion ───── */}
      <Card title="יתרה כולל סגירות" aside="מחושב מ-Notion מתחילת אתגר ה-100K">
        <p className="text-4xl num text-right">{fmt(b.total)}</p>
        <div className="space-y-1.5 border-t border-zinc-800 pt-3">
          <Line label="סכום התחלתי (23.5)" value={b.base} muted />
          <Line label="+ תשלומים שנכנסו" value={b.payments} muted />
          <Line label="− הוצאות (מ-1.6)" value={-b.expenses} muted />
          <Line label={`+ סגירות פתוחות (${actuals.openClosings.length})`} value={b.openClosings} muted />
        </div>
      </Card>

      <DatePicker input={input} />

      {/* ───── This month vs target ───── */}
      <Card title={`החודש — ${monthLabel(now.month)}`}>
        <TargetBar label="סגירות מול יעד הכנסה" actual={now.recordedClosings} target={now.incomeTarget} />
        <TargetBar label="הוצאות מול יעד (כולל קבע ומתוכננות)" actual={now.recordedExpenses} target={now.expenseTarget} invert />
      </Card>

      {/* ───── 12-month forecast ───── */}
      <Card title="תחזית לשנה קדימה" aside="יתרה בסוף כל חודש">
        <ForecastChart rows={rows} start={b.total} />
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-xs min-w-[520px]">
            <thead className="text-zinc-500">
              <tr className="text-right">
                <th className="py-2 font-normal">חודש</th>
                <th className="font-normal">הכנסה</th>
                <th className="font-normal">שוטף</th>
                <th className="font-normal">קבע</th>
                <th className="font-normal">מתוכנן</th>
                <th className="font-normal">יתרה בסוף</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.month} className="border-t border-zinc-800">
                  <td className="py-2 text-zinc-300">
                    {monthLabel(r.month)}
                    {i === 0 && <span className="text-zinc-600"> · נותר</span>}
                  </td>
                  <td className="num text-right text-zinc-400">{fmt(r.incomeRemaining)}</td>
                  <td className="num text-right text-zinc-500">{fmt(-r.variableRemaining)}</td>
                  <td className="num text-right text-zinc-500">{r.standingUpcoming ? fmt(-r.standingUpcoming) : "—"}</td>
                  <td className="num text-right text-zinc-500">{r.plannedUpcoming ? fmt(-r.plannedUpcoming) : "—"}</td>
                  <td className={`num text-right ${r.closing < 0 ? "text-zinc-400" : "text-white"}`}>{fmt(r.closing)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ───── Target vs actual ───── */}
      <Card title="מעקב: יעד מול ביצוע" aside="לפי תאריך סגירה">
        <div className="space-y-5">
          {track.map((t) => (
            <div key={t.month} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{monthLabel(t.month)}</span>
                <span className={`text-xs ${t.delta >= 0 ? "text-white" : "text-zinc-400"}`}>
                  נטו <span className="num">{fmt(t.net)}</span> · פער <span className="num">{signed(t.delta)}</span>
                </span>
              </div>
              <TargetBar label="סגירות" actual={t.closings} target={t.incomeTarget} />
              <TargetBar label="הוצאות" actual={t.expenses} target={t.expenseTarget} invert />
            </div>
          ))}
          {track.length > 0 && (
            <div className="border-t border-zinc-800 pt-3">
              <Line label="פער מצטבר מול היעד" value={signed(track[track.length - 1].cumulativeDelta)} strong />
            </div>
          )}
        </div>
      </Card>

      {/* ───── Targets ───── */}
      <Card title="יעדים חודשיים ממוצעים" aside="הוצאה = שוטף, בלי הוראות קבע">
        <div className="space-y-1.5">
          {plan.targets.map((t) => (
            <div key={t.id} className="flex justify-between items-center text-sm">
              <span className="text-zinc-300">
                {t.kind === "income" ? "הכנסה" : "הוצאה"} · מ-{monthLabel(ymOf(t.from))}
              </span>
              <span className="flex items-center gap-3">
                <span className="num">{fmt(t.amount)}</span>
                <DeleteButton id={t.id} />
              </span>
            </div>
          ))}
        </div>
        <TargetForm today={today} />
      </Card>

      {/* ───── Planned expenses ───── */}
      <Card title="הוצאות מתוכננות">
        {plan.planned.length === 0 && <p className="text-xs text-zinc-600">אין עדיין</p>}
        <div className="space-y-1.5">
          {plan.planned.map((p) => {
            const n = Math.max(1, Math.round(p.installments));
            return (
              <div key={p.id} className="flex justify-between items-center text-sm gap-3">
                <span className="text-zinc-300">
                  {p.name}
                  <span className="text-xs text-zinc-500">
                    {" "}· {n > 1 ? `${n} תשלומים מ-${monthLabel(ymOf(p.date))} (${fmt(p.amount / n)} לחודש)` : dateLabel(p.date)}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="num">{fmt(p.amount)}</span>
                  <DeleteButton id={p.id} />
                </span>
              </div>
            );
          })}
        </div>
        <PlannedForm today={today} />
      </Card>

      {/* ───── Standing orders ───── */}
      <Card title="הוראות קבע" aside={`סה"כ החודש הבא: ${fmt(planMonth(input, addMonths(ymOf(today), 1)).standingUpcoming)}`}>
        {plan.standing.length === 0 && <p className="text-xs text-zinc-600">אין עדיין</p>}
        <div className="space-y-1.5">
          {plan.standing.map((s) => (
            <div key={s.id} className="flex justify-between items-center text-sm gap-3">
              <span className="text-zinc-300">
                {s.name}
                <span className="text-xs text-zinc-500">
                  {" "}· כל {Number(s.start.slice(8, 10))} בחודש{s.end ? ` עד ${dateLabel(s.end)}` : ""}
                </span>
              </span>
              <span className="flex items-center gap-3">
                <span className="num">{fmt(s.amount)}</span>
                <DeleteButton id={s.id} />
              </span>
            </div>
          ))}
        </div>
        <StandingForm today={today} />
      </Card>

      <footer className="text-center text-xs text-zinc-700 pb-4">נתונים מ-Notion · ₪ שקל חדש</footer>
    </main>
  );
}
