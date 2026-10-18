import { Amount, Card, PageTitle, TargetBar } from "@/components/ui";
import { TRACKING_START } from "@/lib/config";
import { monthLabel } from "@/lib/dates";
import { tracking } from "@/lib/forecast";
import { fmt, signed } from "@/lib/format";
import { loadData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function TrackingPage() {
  const { input } = await loadData();
  const rows = tracking(input, TRACKING_START).reverse();
  const cum = rows[0]?.cumulativeDelta ?? 0;

  return (
    <>
      <PageTitle title="יעד מול ביצוע" subtitle="סגירות לפי תאריך סגירה · הוצאות כולל הוראות קבע" />

      <section className="hero rounded-3xl border border-white/10 p-6 space-y-2">
        <p className="text-xs text-zinc-400">פער מצטבר מול היעד מאז {monthLabel(TRACKING_START)}</p>
        <Amount value={cum} size="text-4xl" />
        <p className="text-xs text-zinc-500">{cum >= 0 ? "מעל היעד" : "מתחת ליעד"}</p>
      </section>

      {rows.map((t) => (
        <Card
          key={t.month}
          title={monthLabel(t.month)}
          aside={
            <span className={t.delta >= 0 ? "text-white" : "text-zinc-400"}>
              <span className="num">{signed(t.delta)}</span> מול היעד
            </span>
          }
        >
          <TargetBar label="סגירות" actual={t.closings} target={t.incomeTarget} />
          <TargetBar label="הוצאות" actual={t.expenses} target={t.expenseTarget} invert />
          <div className="flex justify-between text-xs text-zinc-500 border-t border-white/5 pt-3">
            <span>נטו בפועל <span className="num text-zinc-300">{fmt(t.net)}</span></span>
            <span>נטו ביעד <span className="num">{fmt(t.netTarget)}</span></span>
          </div>
        </Card>
      ))}
    </>
  );
}
