import { ForecastChart } from "@/components/ForecastChart";
import { Amount, Card, MoreLink, QuickAction, Row, RowList, TargetBar } from "@/components/ui";
import { FORECAST_MONTHS } from "@/lib/config";
import { dateLabel, dayNum, monthLabel, ymOf, addMonths } from "@/lib/dates";
import { eventsInMonth, forecastMonths, overdueEvents, planMonth } from "@/lib/forecast";
import { fmt } from "@/lib/format";
import { loadData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { today, actuals, input } = await loadData();
  const b = actuals.balance;
  const inAccount = b.base + b.payments - b.expenses;
  const now = planMonth(input, ymOf(today));
  const rows = forecastMonths(input, FORECAST_MONTHS);
  const yearEnd = rows[rows.length - 1];

  // charges in the next 30 days
  const horizon = dayNum(today) + 30;
  const overdue = overdueEvents(input, today);
  const upcoming = [0, 1]
    .flatMap((k) => eventsInMonth(input, addMonths(ymOf(today), k)))
    .filter((e) => e.due > 0 && dayNum(e.date) > dayNum(today) && dayNum(e.date) <= horizon);

  return (
    <>
      {/* ───── Balance hero ───── */}
      <section className="hero rounded-3xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted">יתרה כולל סגירות</span>
          <span className="text-[11px] text-muted">{dateLabel(today)}</span>
        </div>
        <Amount value={b.total} size="text-5xl" />
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-chip/10 border border-line px-4 py-3">
            <p className="text-[11px] text-muted">בחשבון</p>
            <p className="text-base num">{fmt(inAccount)}</p>
          </div>
          <div className="rounded-2xl bg-chip/10 border border-line px-4 py-3">
            <p className="text-[11px] text-muted">סגירות פתוחות · {actuals.openClosings.length}</p>
            <p className="text-base num">{fmt(b.openClosings)}</p>
          </div>
        </div>
        <details className="group text-xs text-muted">
          <summary className="cursor-pointer list-none hover:text-ink">איך זה מחושב ▾</summary>
          <div className="mt-3 space-y-1.5">
            <p>סכום התחלתי (23.5) · {fmt(b.base)}</p>
            <p>+ תשלומים שנכנסו · {fmt(b.payments)}</p>
            <p>− הוצאות (מ-1.6) · {fmt(b.expenses)}</p>
            <p>+ סגירות פתוחות · {fmt(b.openClosings)}</p>
          </div>
        </details>
      </section>

      {/* ───── Quick actions ───── */}
      <div className="grid grid-cols-4 gap-2">
        <QuickAction href="/forecast" icon="chart" label="תחזית" />
        <QuickAction href="/planned" icon="calendar" label="הוצאה מתוכננת" />
        <QuickAction href="/standing" icon="repeat" label="הוראת קבע" />
        <QuickAction href="/targets" icon="sliders" label="יעדים" />
      </div>

      {/* ───── This month ───── */}
      <Card title={`החודש · ${monthLabel(now.month)}`} aside={<MoreLink href="/tracking">מעקב</MoreLink>}>
        <TargetBar label="סגירות מול יעד" actual={now.recordedClosings} target={now.incomeTarget} />
        <TargetBar label="הוצאות מול יעד" actual={now.recordedExpenses} target={now.expenseTarget} invert />
      </Card>

      {/* ───── Year ahead ───── */}
      <Card title={`בעוד שנה · ${monthLabel(yearEnd.month)}`} aside={<MoreLink href="/forecast">לתחזית</MoreLink>}>
        <Amount value={yearEnd.closing} size="text-3xl" />
        <ForecastChart rows={rows} start={b.total} compact />
      </Card>

      {/* ───── Overdue: date passed, no linked expense yet ───── */}
      {overdue.length > 0 && (
        <Card title="טרם יצאו" paper>
          <RowList>
            {overdue.map((e, i) => (
              <Row
                key={i}
                icon="clock"
                title={e.name}
                subtitle={`היה אמור לצאת ב-${dateLabel(e.date)}${e.installment ? ` · תשלום ${e.installment.index}/${e.installment.of}` : ""}`}
                amount={-e.due}
              />
            ))}
          </RowList>
        </Card>
      )}

      {/* ───── Upcoming charges ───── */}
      <Card title="חיובים ב-30 הימים הקרובים">
        <RowList empty="אין חיובים קבועים או מתוכננים בקרוב">
          {upcoming.map((e, i) => (
            <Row
              key={i}
              icon={e.kind === "standing" ? "repeat" : "calendar"}
              title={e.name}
              subtitle={`${dateLabel(e.date)}${e.installment ? ` · תשלום ${e.installment.index}/${e.installment.of}` : ""}`}
              amount={-e.due}
            />
          ))}
        </RowList>
      </Card>

      {/* ───── Open closings ───── */}
      <Card title="סגירות שטרם שולמו" aside={fmt(b.openClosings)}>
        <RowList empty="הכל שולם">
          {actuals.openClosings.map((c, i) => (
            <Row key={i} icon="clock" title={c.name || "ללא שם"} subtitle={c.date ? dateLabel(c.date) : undefined} amount={c.amount} />
          ))}
        </RowList>
      </Card>
    </>
  );
}
