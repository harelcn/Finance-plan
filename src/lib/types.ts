export type TargetKind = "income" | "expense";

/** Monthly target, valid from `from` until a later target of the same kind. */
export interface Target {
  id: string;
  kind: TargetKind;
  amount: number;
  from: string; // YYYY-MM-DD
}

/** A real expense row in Notion linked ("שיוך להוצאה מתוכננת") to a planned expense / standing order. */
export interface LinkedPayment {
  date: string;
  amount: number;
}

/** Known future expense: one lump (installments = 1) or split into monthly installments. */
export interface PlannedExpense {
  id: string;
  name: string;
  amount: number; // total
  date: string; // first charge, YYYY-MM-DD
  installments: number;
  notes?: string;
  payments?: LinkedPayment[];
}

/** Monthly fixed charge on the start date's day-of-month. */
export interface StandingOrder {
  id: string;
  name: string;
  amount: number; // per month
  start: string; // YYYY-MM-DD
  end: string | null;
  notes?: string;
  payments?: LinkedPayment[];
}

export interface PlanSettings {
  targets: Target[];
  planned: PlannedExpense[];
  standing: StandingOrder[];
}

/** Recorded totals per month ("YYYY-MM") from Notion, by closing date / expense date. */
export type MonthlyActuals = Record<string, { closings: number; expenses: number }>;

export interface BalanceBreakdown {
  base: number;
  payments: number;
  expenses: number;
  openClosings: number;
  /** Money moved into the investment portfolio (not an expense). */
  deposits: number;
  /** Market value of the portfolio today. */
  portfolio: number;
  total: number;
}

/** An ETF in the portfolio, priced from the Tel Aviv Stock Exchange by security number. */
export interface Fund {
  id: string;
  name: string;
  securityId: string;
  monthly: number;
  day: number | null;
}

export interface Deposit {
  id: string;
  fundId: string;
  amount: number; // ₪
  date: string; // YYYY-MM-DD
  /** Actual units bought, when known; otherwise derived from the closing price on `date`. */
  units: number | null;
  notes?: string;
}

/** Row lists for the "פירוט הוצאות" / "פירוט הכנסות" screens, straight from Notion. */
export interface ExpenseRow {
  id: string;
  name: string;
  amount: number;
  date: string;
  category: string;
  /** Linked to a planned expense / standing order. */
  planned: boolean;
}

export interface IncomeRow {
  id: string;
  name: string;
  amount: number;
  date: string;
  client: string;
  /** Closings only: "שולם" / "לא שולם" / "שולם חלקית". */
  status?: string;
}

export interface ForecastEvent {
  itemId: string;
  /** Scheduled charge date. */
  date: string;
  name: string;
  /** Scheduled amount for this charge. */
  amount: number;
  /** Part of `amount` not yet covered by linked expenses. 0 = already went out. */
  due: number;
  kind: "standing" | "planned";
  installment?: { index: number; of: number };
}
