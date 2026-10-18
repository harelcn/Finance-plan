import { AddSheet, DeleteButton, StandingForm } from "@/components/Forms";
import { Card, PageTitle, Row, RowList } from "@/components/ui";
import { addMonths, dateLabel, monthLabel, ymOf } from "@/lib/dates";
import { eventsInMonth } from "@/lib/forecast";
import { fmt } from "@/lib/format";
import { loadData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function StandingPage() {
  const { today, plan, input } = await loadData();
  const ym = ymOf(today);
  const nextYm = addMonths(ym, 1);
  const thisMonth = eventsInMonth(input, ym).filter((e) => e.kind === "standing");
  const nextMonth = eventsInMonth(input, nextYm)
    .filter((e) => e.kind === "standing")
    .reduce((s, e) => s + e.amount, 0);

  const statusOf = (id: string) => {
    const e = thisMonth.find((x) => x.itemId === id);
    if (!e) return "לא פעילה החודש";
    return e.date <= today ? `ירדה ב-${dateLabel(e.date)}` : `תרד ב-${dateLabel(e.date)}`;
  };

  return (
    <>
      <PageTitle title="הוראות קבע" subtitle="חיובים חודשיים קבועים — נכנסים לתחזית בכל חודש ביום החיוב" />

      <AddSheet label="הוראת קבע חדשה">
        <StandingForm today={today} />
      </AddSheet>

      <Card title="פעילות" aside={`${monthLabel(nextYm)}: ${fmt(nextMonth)}`}>
        <RowList empty="עוד לא הוספת הוראות קבע">
          {plan.standing.map((s) => (
            <Row
              key={s.id}
              icon="repeat"
              title={s.name}
              subtitle={`כל ${Number(s.start.slice(8, 10))} בחודש${s.end ? ` עד ${dateLabel(s.end)}` : ""} · ${statusOf(s.id)}`}
              amount={-s.amount}
              amountNote="לחודש"
              action={<DeleteButton id={s.id} />}
            />
          ))}
        </RowList>
      </Card>
    </>
  );
}
