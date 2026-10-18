import { AddSheet, TargetForm } from "@/components/Forms";
import { Amount, Card, PageTitle, TargetBar } from "@/components/ui";
import { TRACKING_START } from "@/lib/config";
import { monthLabel } from "@/lib/dates";
import { tracking } from "@/lib/forecast";
import { fmt } from "@/lib/format";
import { loadData } from "@/lib/data";

export const dynamic = "force-dynamic";

function Actual({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between items-baseline text-xs">
      <span className="text-muted">{label}</span>
      <span>
        <span className="num text-ink">{fmt(value)}</span>
        <span className="text-faint"> · לא הוגדר יעד</span>
      </span>
    </div>
  );
}

export default async function TrackingPage() {
  const { input, today } = await loadData();
  const rows = tracking(input, TRACKING_START).reverse();
  const cumIncome = rows[0]?.cumulativeIncomeDelta ?? 0;
  const cumExpense = rows[0]?.cumulativeExpenseDelta ?? 0;
  const missing = rows.some((r) => !r.hasIncomeTarget || !r.hasExpenseTarget);

  return (
    <>
      <PageTitle title="יעד מול ביצוע" />

      <div className="grid grid-cols-2 gap-3">
        <div className="hero rounded-2xl border border-line p-4 space-y-1">
          <p className="text-[11px] text-muted">הכנסות מול היעד</p>
          <Amount value={cumIncome} size="text-2xl" />
          <p className="text-[11px] text-muted">{cumIncome >= 0 ? "מעל היעד" : "מתחת ליעד"}</p>
        </div>
        <div className="hero rounded-2xl border border-line p-4 space-y-1">
          <p className="text-[11px] text-muted">הוצאות מול היעד</p>
          <Amount value={cumExpense} size="text-2xl" />
          <p className="text-[11px] text-muted">{cumExpense >= 0 ? "מתחת ליעד" : "חרגת מהיעד"}</p>
        </div>
      </div>

      {missing && (
        <AddSheet label="הגדר יעד גם לחודשים קודמים">
          <TargetForm today={today} defaultFrom={`${TRACKING_START}-01`} />
        </AddSheet>
      )}

      {rows.map((t) => (
        <Card key={t.month} title={monthLabel(t.month)}>
          {t.hasIncomeTarget ? (
            <div className="space-y-1.5">
              <TargetBar label="הכנסות (סגירות)" actual={t.closings} target={t.incomeTarget} />
              <p className={`text-[11px] ${t.incomeDelta >= 0 ? "text-brand" : "text-danger"}`}>
                <span className="num">{fmt(Math.abs(t.incomeDelta))}</span> {t.incomeDelta >= 0 ? "מעל יעד ההכנסה" : "מתחת ליעד ההכנסה"}
              </p>
            </div>
          ) : (
            <Actual label="הכנסות (סגירות)" value={t.closings} />
          )}
          {t.hasExpenseTarget ? (
            <div className="space-y-1.5">
              <TargetBar label="הוצאות" actual={t.expenses} target={t.expenseTarget} invert />
              <p className={`text-[11px] ${t.expenseDelta >= 0 ? "text-brand" : "text-danger"}`}>
                <span className="num">{fmt(Math.abs(t.expenseDelta))}</span> {t.expenseDelta >= 0 ? "מתחת ליעד ההוצאה" : "מעל יעד ההוצאה"}
              </p>
            </div>
          ) : (
            <Actual label="הוצאות" value={t.expenses} />
          )}
        </Card>
      ))}
    </>
  );
}
