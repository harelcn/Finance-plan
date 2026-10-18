import { cache } from "react";
import type { ForecastInput } from "./forecast";
import { todayIL } from "./format";
import { getActuals } from "./notion";
import { getPlan } from "./plan-store";

/** One Notion round-trip per request, shared by every server component that asks. */
export const loadData = cache(async () => {
  const today = todayIL();
  const [actuals, plan] = await Promise.all([getActuals(), getPlan()]);
  const input: ForecastInput = {
    ...plan,
    today,
    currentBalance: actuals.balance.total,
    actuals: actuals.monthly,
  };
  return { today, actuals, plan, input };
});
