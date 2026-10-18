export type TargetKind = "income" | "expense";

/** Monthly target, valid from `from` until a later target of the same kind. */
export interface Target {
  id: string;
  kind: TargetKind;
  amount: number;
  from: string; // YYYY-MM-DD
}

/** A real expense row in Notion that was linked ("שיוך לתכנון") to a plan item. */
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
  total: number;
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
