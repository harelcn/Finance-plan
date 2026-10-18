import { Client } from "@notionhq/client";
import { BASE_AMOUNT, DB_IDS, EXPENSES_START, PAYMENTS_START, TRACKING_START } from "./config";
import type { BalanceBreakdown, LinkedPayment, MonthlyActuals } from "./types";

export const notion = new Client({ auth: process.env.NOTION_TOKEN });

/** Retries transient network / rate-limit failures with a short backoff. */
async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i >= attempts) throw e;
      await new Promise((r) => setTimeout(r, 400 * i));
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function queryAll(dbId: string, filter?: any): Promise<any[]> {
  const results = [];
  let cursor: string | undefined;
  do {
    const res = await withRetry(() =>
      notion.databases.query({
        database_id: dbId,
        filter,
        start_cursor: cursor,
        page_size: 100,
      }),
    );
    results.push(...res.results);
    cursor = res.next_cursor ?? undefined;
  } while (cursor);
  return results;
}

const num = (v: unknown) => (typeof v === "number" ? v : 0);

export interface ActualsData {
  balance: BalanceBreakdown;
  monthly: MonthlyActuals;
  openClosings: Array<{ name: string; amount: number; date: string }>;
  /** Expenses linked via "שיוך לתכנון", keyed by plan-row id. */
  links: Record<string, LinkedPayment[]>;
}

/**
 * Balance = base + payments received since challenge start − expenses since June
 * + whatever is still owed on closings. Same formula as the 100K dashboard.
 */
export async function getActuals(): Promise<ActualsData> {
  const trackingFrom = `${TRACKING_START}-01`;
  const [payments, expenses, closings, open] = await Promise.all([
    queryAll(DB_IDS.PAYMENTS, { property: "תאריך כניסה", date: { on_or_after: PAYMENTS_START } }),
    queryAll(DB_IDS.EXPENSES, { property: "Date", date: { on_or_after: EXPENSES_START } }),
    queryAll(DB_IDS.CLOSINGS, { property: "תאריך סגירה", date: { on_or_after: trackingFrom } }),
    queryAll(DB_IDS.CLOSINGS, { property: "תשלום", status: { does_not_equal: "שולם" } }),
  ]);

  const paymentsTotal = payments.reduce((s, r) => s + num(r.properties["סכום שנכנס"]?.number), 0);

  const monthly: MonthlyActuals = {};
  const bucket = (date: string) => (monthly[date.slice(0, 7)] ??= { closings: 0, expenses: 0 });

  let expensesTotal = 0;
  const links: Record<string, LinkedPayment[]> = {};
  for (const r of expenses) {
    const amount = num(r.properties["Amount"]?.number);
    const date: string = r.properties["Date"]?.date?.start?.slice(0, 10) ?? "";
    expensesTotal += amount;
    if (!date) continue;
    bucket(date).expenses += amount;
    for (const rel of r.properties["שיוך לתכנון"]?.relation ?? []) {
      (links[rel.id] ??= []).push({ date, amount });
    }
  }

  for (const r of closings) {
    const date: string = r.properties["תאריך סגירה"]?.date?.start ?? "";
    if (date) bucket(date).closings += num(r.properties["סכום שנסגר"]?.number);
  }

  // "לא שולם" counts in full (as in the 100K dashboard); "שולם חלקית" counts what is still owed.
  const openClosings = open
    .map((r) => {
      const amount = num(r.properties["סכום שנסגר"]?.number);
      const status = r.properties["תשלום"]?.status?.name;
      const paid = num(r.properties['סה"כ שולם']?.rollup?.number);
      return {
        name: r.properties["Name"]?.title?.[0]?.plain_text ?? "",
        amount: status === "שולם חלקית" ? Math.max(0, amount - paid) : amount,
        date: r.properties["תאריך סגירה"]?.date?.start ?? "",
      };
    })
    .filter((c) => c.amount > 0);
  const openTotal = openClosings.reduce((s, c) => s + c.amount, 0);

  return {
    balance: {
      base: BASE_AMOUNT,
      payments: paymentsTotal,
      expenses: expensesTotal,
      openClosings: openTotal,
      total: BASE_AMOUNT + paymentsTotal - expensesTotal + openTotal,
    },
    monthly,
    openClosings,
    links,
  };
}
