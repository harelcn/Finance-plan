import { Client } from "@notionhq/client";
import { BASE_AMOUNT, DB_IDS, EXPENSES_START, PAYMENTS_START, TRACKING_START } from "./config";
import type { BalanceBreakdown, ExpenseRow, IncomeRow, LinkedPayment, MonthlyActuals } from "./types";

export const notion = new Client({ auth: process.env.NOTION_TOKEN });

/** Retries transient network drops / rate limits: waits 0.5s, 1s, 2s, 3s (~6.5s total) before giving up. */
const BACKOFF_MS = [500, 1000, 2000, 3000];
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i >= BACKOFF_MS.length) throw e;
      await new Promise((r) => setTimeout(r, BACKOFF_MS[i]));
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
  /** Expenses linked via "שיוך להוצאה מתוכננת", keyed by planned-expense id. */
  links: Record<string, LinkedPayment[]>;
  expenseRows: ExpenseRow[];
  paymentRows: IncomeRow[];
  closingRows: IncomeRow[];
}

const titleOf = (p: any): string => p?.title?.map((t: any) => t.plain_text).join("") ?? ""; // eslint-disable-line @typescript-eslint/no-explicit-any

/** id → title for a lookup database (clients, categories). */
async function nameMap(dbId: string, titleProp: string): Promise<Record<string, string>> {
  const rows = await queryAll(dbId);
  return Object.fromEntries(rows.map((r) => [r.id, titleOf(r.properties[titleProp])]));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const firstName = (rel: any, names: Record<string, string>) =>
  (rel?.relation ?? []).map((x: { id: string }) => names[x.id]).filter(Boolean).join(", ");

/**
 * Balance = base + payments received since challenge start − expenses since June
 * + whatever is still owed on closings. Same formula as the 100K dashboard.
 */
export async function getActuals(): Promise<ActualsData> {
  // closings from challenge start (lists); tracking still starts at TRACKING_START
  const [payments, expenses, closings, open, clients, categories] = await Promise.all([
    queryAll(DB_IDS.PAYMENTS, { property: "תאריך כניסה", date: { on_or_after: PAYMENTS_START } }),
    queryAll(DB_IDS.EXPENSES, { property: "Date", date: { on_or_after: EXPENSES_START } }),
    queryAll(DB_IDS.CLOSINGS, { property: "תאריך סגירה", date: { on_or_after: PAYMENTS_START } }),
    queryAll(DB_IDS.CLOSINGS, { property: "תשלום", status: { does_not_equal: "שולם" } }),
    nameMap(DB_IDS.CLIENTS, "שם לקוח").catch(() => ({}) as Record<string, string>),
    nameMap(DB_IDS.CATEGORIES, "Name").catch(() => ({}) as Record<string, string>),
  ]);

  const paymentsTotal = payments.reduce((s, r) => s + num(r.properties["סכום שנכנס"]?.number), 0);

  const monthly: MonthlyActuals = {};
  const bucket = (date: string) => (monthly[date.slice(0, 7)] ??= { closings: 0, expenses: 0 });

  let expensesTotal = 0;
  const links: Record<string, LinkedPayment[]> = {};
  const expenseRows: ExpenseRow[] = [];
  for (const r of expenses) {
    const amount = num(r.properties["Amount"]?.number);
    const date: string = r.properties["Date"]?.date?.start?.slice(0, 10) ?? "";
    expensesTotal += amount;
    if (!date) continue;
    bucket(date).expenses += amount;
    const linked = r.properties["שיוך להוצאה מתוכננת"]?.relation ?? [];
    for (const rel of linked) {
      (links[rel.id] ??= []).push({ date, amount });
    }
    expenseRows.push({
      id: r.id,
      name: titleOf(r.properties["Name"]),
      amount,
      date,
      category: firstName(r.properties["Category"], categories),
      planned: linked.length > 0,
    });
  }

  const paymentRows: IncomeRow[] = payments
    .map((r) => ({
      id: r.id,
      name: titleOf(r.properties["Name"]),
      amount: num(r.properties["סכום שנכנס"]?.number),
      date: r.properties["תאריך כניסה"]?.date?.start?.slice(0, 10) ?? "",
      client: firstName(r.properties["לקוח"], clients),
    }))
    .filter((p) => p.date);

  const closingRows: IncomeRow[] = [];
  for (const r of closings) {
    const date: string = r.properties["תאריך סגירה"]?.date?.start?.slice(0, 10) ?? "";
    if (!date) continue;
    const amount = num(r.properties["סכום שנסגר"]?.number);
    if (date >= `${TRACKING_START}-01`) bucket(date).closings += amount;
    closingRows.push({
      id: r.id,
      name: titleOf(r.properties["Name"]),
      amount,
      date,
      client: firstName(r.properties["לקוח"], clients),
      status: r.properties["תשלום"]?.status?.name ?? "",
    });
  }

  const byDateDesc = (a: { date: string }, b: { date: string }) => b.date.localeCompare(a.date);
  expenseRows.sort(byDateDesc);
  paymentRows.sort(byDateDesc);
  closingRows.sort(byDateDesc);

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
      // the portfolio is added in data.ts, once deposits and market prices are known
      deposits: 0,
      portfolio: 0,
      total: BASE_AMOUNT + paymentsTotal - expensesTotal + openTotal,
    },
    monthly,
    openClosings,
    links,
    expenseRows,
    paymentRows,
    closingRows,
  };
}
