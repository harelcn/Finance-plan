import { cache } from "react";
import type { ForecastInput } from "./forecast";
import { todayIL } from "./format";
import { getActuals } from "./notion";
import { getPlan } from "./plan-store";

/** One Notion round-trip per request, shared by every server component that asks. */
export const loadData = cache(async () => {
  const today = todayIL();
  const [actuals, rawPlan] = await Promise.all([getActuals(), getPlan()]);

  // attach the real expenses linked to each item ("שיוך להוצאה מתוכננת")
  const withPayments = <T extends { id: string }>(i: T) => ({ ...i, payments: actuals.links[i.id] ?? [] });
  const plan = { ...rawPlan, planned: rawPlan.planned.map(withPayments), standing: rawPlan.standing.map(withPayments) };

  const input: ForecastInput = {
    ...plan,
    today,
    currentBalance: actuals.balance.total,
    actuals: actuals.monthly,
  };
  return { today, actuals, plan, input };
});
