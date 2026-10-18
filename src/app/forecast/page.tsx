import { DatePicker } from "@/components/DatePicker";
import { ForecastChart } from "@/components/ForecastChart";
import { Card } from "@/components/ui";
import { FORECAST_MONTHS } from "@/lib/config";
import { monthLabel } from "@/lib/dates";
import { forecastMonths } from "@/lib/forecast";
import { fmt, signed } from "@/lib/format";
import { loadData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ForecastPage() {
  const { input } = await loadData();
  const rows = forecastMonths(input, FORECAST_MONTHS);

  return (
    <>
      <DatePicker input={input} />

      <Card title="יתרה בסוף כל חודש" aside="שנה קדימה">
        <ForecastChart rows={rows} start={input.currentBalance} />
      </Card>

      <Card title="פירוט חודשי">
        <div className="divide-y divide-white/5 -my-2">
          {rows.map((r, i) => {
            const net = r.closing - r.opening;
            return (
              <details key={r.month} className="group py-3">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="flex flex-col">
                    <span className="text-sm">{monthLabel(r.month)}</span>
                    <span className="text-[11px] text-zinc-500">
                      {i === 0 ? "עד סוף החודש · " : ""}
                      <span className="num">{signed(net)}</span>
                    </span>
                  </span>
                  <span className={`num text-base ${r.closing < 0 ? "text-zinc-400" : ""}`}>{fmt(r.closing)}</span>
                </summary>
                <div className="mt-3 space-y-1.5 text-xs text-zinc-400 bg-white/[0.03] rounded-xl p-3">
                  <div className="flex justify-between"><span>פתיחה</span><span className="num">{fmt(r.opening)}</span></div>
                  <div className="flex justify-between"><span>הכנסה צפויה</span><span className="num">{fmt(r.incomeRemaining)}</span></div>
                  <div className="flex justify-between"><span>הוצאות שוטפות</span><span className="num">{fmt(-r.variableRemaining)}</span></div>
                  {r.standingUpcoming > 0 && <div className="flex justify-between"><span>הוראות קבע</span><span className="num">{fmt(-r.standingUpcoming)}</span></div>}
                  {r.upcoming.filter((e) => e.kind === "planned").map((e, k) => (
                    <div key={k} className="flex justify-between">
                      <span>{e.name}{e.installment ? ` (${e.installment.index}/${e.installment.of})` : ""}{e.date <= input.today ? " · טרם יצא" : ""}</span>
                      <span className="num">{fmt(-e.due)}</span>
                    </div>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      </Card>
    </>
  );
}
