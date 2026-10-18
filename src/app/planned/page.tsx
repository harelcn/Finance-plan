import { AddSheet, DeleteButton, PlannedForm } from "@/components/Forms";
import { Card, PageTitle, Row, RowList } from "@/components/ui";
import { dateLabel, monthLabel, ymOf } from "@/lib/dates";
import { plannedSchedule } from "@/lib/forecast";
import { fmt } from "@/lib/format";
import { loadData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function PlannedPage() {
  const { today, plan } = await loadData();
  const items = plan.planned.map((p) => {
    const schedule = plannedSchedule(p);
    const remaining = schedule.reduce((s, e) => s + e.due, 0);
    const paidCount = schedule.filter((e) => e.due === 0).length;
    const overdue = schedule.filter((e) => e.due > 0 && e.date <= today).length;
    return { p, schedule, remaining, paidCount, overdue };
  });
  const open = items.filter((i) => i.remaining > 0);
  const done = items.filter((i) => i.remaining === 0);
  const totalRemaining = open.reduce((s, i) => s + i.remaining, 0);

  const status = (i: (typeof items)[number]) => {
    const n = i.schedule.length;
    if (i.remaining === 0) return "יצא במלואו ✓";
    const paid = i.p.amount - i.remaining;
    const partial = paid > 0 ? `יצא חלקית ${fmt(paid)} · ` : "";
    if (i.overdue > 0) return partial + (n > 1 ? `${i.overdue} תשלומים טרם יצאו` : "התאריך עבר · טרם יצא");
    return partial + (n > 1 ? `שולמו ${i.paidCount}/${n}` : `מתוכנן ל-${dateLabel(i.p.date)}`);
  };

  return (
    <>
      <PageTitle title="הוצאות מתוכננות" />

      <AddSheet label="הוצאה חדשה">
        <PlannedForm today={today} />
      </AddSheet>

      <Card title="פתוחות" aside={`נשאר לשלם ${fmt(totalRemaining)}`}>
        <RowList empty="אין הוצאות מתוכננות פתוחות">
          {open.map((i) => {
            const n = i.schedule.length;
            return (
              <Row
                key={i.p.id}
                icon={i.overdue > 0 ? "clock" : "calendar"}
                title={i.p.name}
                subtitle={`${n > 1 ? `${n} תשלומים מ-${monthLabel(ymOf(i.p.date))} · ` : ""}${status(i)}`}
                amount={-i.remaining}
                amountNote={i.remaining < i.p.amount ? `מתוך ${fmt(i.p.amount)}` : n > 1 ? `${fmt(i.p.amount / n)} לחודש` : "חד פעמי"}
                action={<DeleteButton id={i.p.id} />}
              />
            );
          })}
        </RowList>
      </Card>

      {done.length > 0 && (
        <Card title="יצאו">
          <RowList>
            {done.map((i) => (
              <Row
                key={i.p.id}
                icon="calendar"
                title={i.p.name}
                subtitle={status(i)}
                amount={-i.p.amount}
                done
                action={<DeleteButton id={i.p.id} />}
              />
            ))}
          </RowList>
        </Card>
      )}
    </>
  );
}
