import { AddSheet, DeleteButton, PlannedForm } from "@/components/Forms";
import { Card, PageTitle, Row, RowList } from "@/components/ui";
import { dateLabel, monthLabel, ymOf } from "@/lib/dates";
import { fmt } from "@/lib/format";
import { loadData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function PlannedPage() {
  const { today, plan } = await loadData();
  const upcoming = plan.planned.filter((p) => p.date >= today || p.installments > 1);
  const total = upcoming.reduce((s, p) => s + p.amount, 0);

  return (
    <>
      <PageTitle title="הוצאות מתוכננות" subtitle="הוצאות שאתה יודע שיגיעו — בבום אחד או בתשלומים" />

      <AddSheet label="הוצאה חדשה">
        <PlannedForm today={today} />
      </AddSheet>

      <Card title="ברשימה" aside={`סה"כ ${fmt(total)}`}>
        <RowList empty="עוד לא הוספת הוצאות מתוכננות">
          {plan.planned.map((p) => {
            const n = Math.max(1, Math.round(p.installments));
            return (
              <Row
                key={p.id}
                icon="calendar"
                title={p.name}
                subtitle={n > 1 ? `${n} תשלומים מ-${monthLabel(ymOf(p.date))}` : dateLabel(p.date)}
                amount={-p.amount}
                amountNote={n > 1 ? `${fmt(p.amount / n)} לחודש` : "חד פעמי"}
                action={<DeleteButton id={p.id} />}
              />
            );
          })}
        </RowList>
      </Card>
    </>
  );
}
