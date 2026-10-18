import { Amount, Card, PageTitle, TargetBar } from "@/components/ui";
import { TRACKING_START } from "@/lib/config";
import { monthLabel } from "@/lib/dates";
import { tracking } from "@/lib/forecast";
import { fmt } from "@/lib/format";
import { loadData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function TrackingPage() {
  const { input } = await loadData();
  const rows = tracking(input, TRACKING_START).reverse();
  const cumIncome = rows[0]?.cumulativeIncomeDelta ?? 0;
  const cumExpense = rows[0]?.cumulativeExpenseDelta ?? 0;

  return (
    <>
      <PageTitle title="יעד מול ביצוע" subtitle={`הכנסות מול יעד הכנסה · הוצאות מול יעד הוצאה · מאז ${monthLabel(TRACKING_START)}`} />

      <div className="grid grid-cols-2 gap-3">
        <div className="hero rounded-2xl border border-white/10 p-4 space-y-1">
          <p className="text-[11px] text-zinc-400">הכנסות מול היעד</p>
          <Amount value={cumIncome} size="text-2xl" />
          <p className="text-[11px] text-zinc-500">{cumIncome >= 0 ? "מעל היעד" : "מתחת ליעד"}</p>
        </div>
        <div className="hero rounded-2xl border border-white/10 p-4 space-y-1">
          <p className="text-[11px] text-zinc-400">הוצאות מול היעד</p>
          <Amount value={cumExpense} size="text-2xl" />
          <p className="text-[11px] text-zinc-500">{cumExpense >= 0 ? "חסכת מתחת ליעד" : "חרגת מהיעד"}</p>
        </div>
      </div>

      {rows.map((t) => (
        <Card key={t.month} title={monthLabel(t.month)}>
          <div className="space-y-1.5">
            <TargetBar label="הכנסות (סגירות)" actual={t.closings} target={t.incomeTarget} />
            <p className={`text-[11px] ${t.incomeDelta >= 0 ? "text-white" : "text-zinc-500"}`}>
              <span className="num">{fmt(Math.abs(t.incomeDelta))}</span> {t.incomeDelta >= 0 ? "מעל יעד ההכנסה" : "מתחת ליעד ההכנסה"}
            </p>
          </div>
          <div className="space-y-1.5">
            <TargetBar label="הוצאות" actual={t.expenses} target={t.expenseTarget} invert />
            <p className={`text-[11px] ${t.expenseDelta >= 0 ? "text-white" : "text-zinc-500"}`}>
              <span className="num">{fmt(Math.abs(t.expenseDelta))}</span> {t.expenseDelta >= 0 ? "מתחת ליעד ההוצאה" : "מעל יעד ההוצאה"}
            </p>
          </div>
        </Card>
      ))}
    </>
  );
}
