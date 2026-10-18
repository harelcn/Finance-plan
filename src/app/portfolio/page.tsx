import { AddSheet } from "@/components/Forms";
import { DepositForm, EditablePortfolioRow } from "@/components/PortfolioForms";
import { Amount, Card, PageTitle, Row, RowList } from "@/components/ui";
import { dateLabel, monthLabel, ymOf } from "@/lib/dates";
import { fmt, signed } from "@/lib/format";
import { loadData } from "@/lib/data";

export const dynamic = "force-dynamic";

const pctLabel = (p: number) => `${p >= 0 ? "+" : ""}${p.toFixed(2)}%`;

export default async function PortfolioPage() {
  const { today, funds, portfolio: p } = await loadData();
  const planned = p.funds.filter((f) => f.fund.monthly > 0);
  const latestDate = p.funds.map((f) => f.latest?.date).filter(Boolean).sort().at(-1);

  return (
    <>
      <PageTitle title="תיק השקעות" />

      <section className="hero space-y-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted">שווי התיק</span>
          {latestDate && <span className="text-[11px] text-muted">שער סגירה {dateLabel(latestDate)}</span>}
        </div>
        <Amount value={p.value} size="text-5xl" />
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-chip/10 px-4 py-3">
            <p className="text-[11px] text-muted">הופקד</p>
            <p className="text-base num">{fmt(p.deposited)}</p>
          </div>
          <div className="rounded-2xl bg-chip/10 px-4 py-3">
            <p className="text-[11px] text-muted">רווח / הפסד</p>
            <p className={`text-base num ${p.gain < 0 ? "text-danger" : ""}`}>
              {signed(p.gain)} · {pctLabel(p.gainPct)}
            </p>
          </div>
        </div>
      </section>

      <AddSheet label="הפקדה חדשה">
        <DepositForm funds={funds} today={today} />
      </AddSheet>

      {planned.length > 0 && (
        <Card title={`הפקדות ${monthLabel(ymOf(today))}`}>
          <RowList>
            {planned.map((f) => {
              const left = Math.max(0, f.fund.monthly - f.depositedThisMonth);
              return (
                <Row
                  key={f.fund.id}
                  icon={left === 0 ? "target" : "clock"}
                  title={f.fund.name}
                  subtitle={left === 0 ? "הופקד ✓" : `טרם הופקד${f.fund.day ? ` · ב-${f.fund.day} לחודש` : ""}`}
                  amount={f.depositedThisMonth}
                  amountNote={`מתוך ${fmt(f.fund.monthly)}`}
                />
              );
            })}
          </RowList>
        </Card>
      )}

      <Card title="קרנות">
        <RowList>
          {p.funds.map((f) => (
            <EditablePortfolioRow
              key={f.fund.id}
              today={today}
              funds={funds}
              fund={f.fund}
              row={
                <Row
                  icon="chart"
                  title={f.fund.name}
                  subtitle={`הופקד ${fmt(f.deposited)}${f.fund.monthly ? ` · ${fmt(f.fund.monthly)} לחודש` : ""}`}
                  amount={f.value}
                  amountNote={f.deposited > 0 ? pctLabel(f.gainPct) : f.latest ? `שער ${(f.latest.close / 100).toFixed(2)}` : "אין מחיר"}
                />
              }
            />
          ))}
        </RowList>
      </Card>

      <Card title="הפקדות">
        <RowList empty="עוד לא נרשמו הפקדות">
          {p.deposits.map((d) => (
            <EditablePortfolioRow
              key={d.deposit.id}
              today={today}
              funds={funds}
              deposit={d.deposit}
              row={
                <Row
                  icon="wallet"
                  title={d.fund?.name ?? "קרן"}
                  subtitle={`${dateLabel(d.deposit.date)} · הופקד ${fmt(d.deposit.amount)}`}
                  amount={d.value}
                  amountNote={d.priced ? pctLabel(d.gainPct) : "אין מחיר"}
                />
              }
            />
          ))}
        </RowList>
      </Card>
    </>
  );
}
