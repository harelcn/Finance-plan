import { cache } from "react";
import type { ForecastInput } from "./forecast";
import { todayIL } from "./format";
import { getActuals } from "./notion";
import { getPlan } from "./plan-store";

/** One Notion round-trip per request, shared by every server component that asks. */
export const loadData = cache(async () => {
  const today = todayIL();
  const [actuals, rawPlan] = await Promise.all([getActuals(), getPlan()]);

  // attach the real expenses linked to each plan item ("שיוך לתכנון")
  const linked = <T extends { id: string }>(item: T) => ({ ...item, payments: actuals.links[item.id] ?? [] });
  const plan = { ...rawPlan, planned: rawPlan.planned.map(linked), standing: rawPlan.standing.map(linked) };

  const input: ForecastInput = {
    ...plan,
    today,
    currentBalance: actuals.balance.total,
    actuals: actuals.monthly,
  };
  return { today, actuals, plan, input };
});
