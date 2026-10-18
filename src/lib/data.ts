import { unstable_cache } from "next/cache";
import { cache } from "react";
import type { ForecastInput } from "./forecast";
import { todayIL } from "./format";
import { getActuals } from "./notion";
import { getPlan } from "./plan-store";
import { valuePortfolio, type PriceData } from "./portfolio";
import { getDeposits, getFunds } from "./portfolio-store";
import { closeOn, latestClose } from "./tase";

/** Cache tag for everything read from Notion; saving in the app or "רענן נתונים" clears it. */
export const NOTION_TAG = "notion";

/**
 * Notion results are cached on the server for 60s, so moving between screens doesn't wait on
 * Notion every time. Edits made in the app invalidate it immediately; edits made directly in
 * Notion show up within a minute (or right away via "רענן נתונים").
 */
const notionSnapshot = unstable_cache(
  async () => {
    const [actuals, plan, funds, deposits] = await Promise.all([getActuals(), getPlan(), getFunds(), getDeposits()]);
    return { actuals, plan, funds, deposits };
  },
  ["notion-snapshot"],
  { revalidate: 60, tags: [NOTION_TAG] },
);

/** One snapshot per request, shared by every server component that asks. */
export const loadData = cache(async () => {
  const today = todayIL();
  const { actuals: rawActuals, plan: rawPlan, funds, deposits } = await notionSnapshot();

  // attach the real expenses linked to each item ("שיוך להוצאה מתוכננת")
  const withPayments = <T extends { id: string }>(i: T) => ({ ...i, payments: rawActuals.links[i.id] ?? [] });
  const plan = { ...rawPlan, planned: rawPlan.planned.map(withPayments), standing: rawPlan.standing.map(withPayments) };

  // market prices from TASE (cached separately: buy-day closes for a week, latest for an hour)
  const prices: PriceData = { latest: {}, buy: {} };
  await Promise.all([
    ...funds.map(async (f) => void (prices.latest[f.id] = await latestClose(f.securityId, today))),
    ...deposits.map(async (d) => {
      const fund = funds.find((f) => f.id === d.fundId);
      prices.buy[d.id] = fund && d.units === null ? await closeOn(fund.securityId, d.date) : null;
    }),
  ]);
  const portfolio = valuePortfolio(funds, deposits, prices, today);

  // A deposit is a transfer, not an expense: cash goes down, the portfolio (at market value) goes up.
  const b = rawActuals.balance;
  const actuals = {
    ...rawActuals,
    balance: {
      ...b,
      deposits: portfolio.deposited,
      portfolio: portfolio.value,
      total: b.total - portfolio.deposited + portfolio.value,
    },
  };

  const input: ForecastInput = {
    ...plan,
    today,
    currentBalance: actuals.balance.total,
    actuals: actuals.monthly,
  };
  return { today, actuals, plan, input, funds, portfolio };
});
