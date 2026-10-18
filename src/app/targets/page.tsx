import { AddSheet, EditableRow, TargetForm } from "@/components/Forms";
import { Amount, Card, PageTitle, Row, RowList } from "@/components/ui";
import { monthLabel, ymOf } from "@/lib/dates";
import { targetFor } from "@/lib/forecast";
import { loadData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function TargetsPage() {
  const { today, plan } = await loadData();
  const ym = ymOf(today);
  const income = targetFor(plan.targets, "income", ym);
  const expense = targetFor(plan.targets, "expense", ym);

  return (
    <>
      <PageTitle title="יעדים חודשיים" />

      <div className="grid grid-cols-2 gap-3">
        <div className="band rounded-3xl p-4 space-y-1">
          <p className="text-[11px] text-muted">הכנסה חודשית</p>
          <Amount value={income} size="text-2xl" />
        </div>
        <div className="band rounded-3xl p-4 space-y-1">
          <p className="text-[11px] text-muted">הוצאה חודשית</p>
          <Amount value={expense} size="text-2xl" />
        </div>
      </div>

      <AddSheet label="עדכון יעד">
        <TargetForm today={today} />
      </AddSheet>

      <Card title="היסטוריית יעדים">
        <RowList>
          {[...plan.targets].reverse().map((t) => (
            <EditableRow
              key={t.id}
              today={today}
              kind="target"
              item={t}
              row={
                <Row
                  icon={t.kind === "income" ? "chart" : "wallet"}
                  title={t.kind === "income" ? "יעד הכנסה" : "יעד הוצאה"}
                  subtitle={`בתוקף מ-${monthLabel(ymOf(t.from))}`}
                  amount={t.kind === "income" ? t.amount : -t.amount}
                />
              }
            />
          ))}
        </RowList>
      </Card>
    </>
  );
}
