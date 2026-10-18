import { unstable_cache } from "next/cache";
import { cache } from "react";
import type { ForecastInput } from "./forecast";
import { todayIL } from "./format";
import { getActuals } from "./notion";
import { getPlan } from "./plan-store";

/** Cache tag for everything read from Notion; saving in the app or "רענן נתונים" clears it. */
export const NOTION_TAG = "notion";

/**
 * Notion results are cached on the server for 60s, so moving between screens doesn't wait on
 * six Notion queries every time. Edits made in the app invalidate it immediately; edits made
 * directly in Notion show up within a minute (or right away via "רענן נתונים").
 */
const notionSnapshot = unstable_cache(
  async () => {
    const [actuals, plan] = await Promise.all([getActuals(), getPlan()]);
    return { actuals, plan };
  },
  ["notion-snapshot"],
  { revalidate: 60, tags: [NOTION_TAG] },
);

/** One snapshot per request, shared by every server component that asks. */
export const loadData = cache(async () => {
  const today = todayIL();
  const { actuals, plan: rawPlan } = await notionSnapshot();

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
