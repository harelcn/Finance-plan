import {
  addMonths,
  dateInMonth,
  dayNum,
  monthEnd,
  monthStart,
  monthsBetween,
  ymOf,
} from "./dates";
import type {
  ForecastEvent,
  MonthlyActuals,
  PlanSettings,
  PlannedExpense,
  StandingOrder,
  Target,
  TargetKind,
} from "./types";

export interface ForecastInput extends PlanSettings {
  today: string; // YYYY-MM-DD
  currentBalance: number;
  actuals: MonthlyActuals;
}

/** Latest target of `kind` whose start month is on or before `ym`. */
export function targetFor(targets: Target[], kind: TargetKind, ym: string): number {
  let best: Target | null = null;
  for (const t of targets) {
    if (t.kind !== kind || ymOf(t.from) > ym) continue;
    if (!best || t.from > best.from) best = t;
  }
  return best?.amount ?? 0;
}

function standingEvents(orders: StandingOrder[], ym: string): ForecastEvent[] {
  const out: ForecastEvent[] = [];
  for (const o of orders) {
    if (ymOf(o.start) > ym) continue;
    if (o.end && ymOf(o.end) < ym) continue;
    const date = dateInMonth(ym, Number(o.start.slice(8, 10)));
    if (date < o.start || (o.end && date > o.end)) continue;
    out.push({ date, name: o.name, amount: o.amount, kind: "standing" });
  }
  return out;
}

function plannedEvents(items: PlannedExpense[], ym: string): ForecastEvent[] {
  const out: ForecastEvent[] = [];
  for (const p of items) {
    const n = Math.max(1, Math.round(p.installments || 1));
    const first = ymOf(p.date);
    for (let k = 0; k < n; k++) {
      if (addMonths(first, k) !== ym) continue;
      out.push({
        date: dateInMonth(ym, Number(p.date.slice(8, 10))),
        name: p.name,
        amount: p.amount / n,
        kind: "planned",
        installment: n > 1 ? { index: k + 1, of: n } : undefined,
      });
    }
  }
  return out;
}

/** Every standing-order charge and planned installment that falls in `ym`. */
export function eventsInMonth(s: PlanSettings, ym: string): ForecastEvent[] {
  return [...standingEvents(s.standing, ym), ...plannedEvents(s.planned, ym)].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

export interface MonthPlan {
  month: string;
  incomeTarget: number;
  expenseTarget: number; // variable target + every explicit item in the month
  recordedClosings: number;
  recordedExpenses: number;
  /** Income still expected after `today` (target minus what is already closed). */
  incomeRemaining: number;
  /** Variable spending still expected after `today`, on top of the explicit items below. */
  variableRemaining: number;
  /** Explicit items dated after `today`. */
  upcoming: ForecastEvent[];
  standingUpcoming: number;
  plannedUpcoming: number;
  /** Day numbers bounding the still-open part of the month: (windowStart, windowEnd]. */
  windowStart: number;
  windowEnd: number;
}

/**
 * What is still expected to happen in `ym` after `today`.
 * Anything already recorded in Notion is already inside the current balance, so only the
 * gap to the target (and items not yet charged) is added — nothing is counted twice.
 */
export function planMonth(input: ForecastInput, ym: string): MonthPlan {
  const today = dayNum(input.today);
  const events = eventsInMonth(input, ym);
  const upcoming = events.filter((e) => dayNum(e.date) > today);
  const incomeTarget = targetFor(input.targets, "income", ym);
  const variableTarget = targetFor(input.targets, "expense", ym);
  const expenseTarget = variableTarget + events.reduce((s, e) => s + e.amount, 0);
  const rec = input.actuals[ym] ?? { closings: 0, expenses: 0 };
  const upcomingTotal = upcoming.reduce((s, e) => s + e.amount, 0);

  const windowStart = Math.max(today, dayNum(monthStart(ym)) - 1);
  const windowEnd = dayNum(monthEnd(ym));
  const open = windowEnd > windowStart;

  return {
    month: ym,
    incomeTarget,
    expenseTarget,
    recordedClosings: rec.closings,
    recordedExpenses: rec.expenses,
    incomeRemaining: open ? Math.max(0, incomeTarget - rec.closings) : 0,
    variableRemaining: open ? Math.max(0, expenseTarget - rec.expenses - upcomingTotal) : 0,
    upcoming,
    standingUpcoming: upcoming.filter((e) => e.kind === "standing").reduce((s, e) => s + e.amount, 0),
    plannedUpcoming: upcoming.filter((e) => e.kind === "planned").reduce((s, e) => s + e.amount, 0),
    windowStart,
    windowEnd,
  };
}

export interface ForecastRow extends MonthPlan {
  opening: number;
  closing: number;
}

/** Current month plus the next `monthsAhead` months. */
export function forecastMonths(input: ForecastInput, monthsAhead = 12): ForecastRow[] {
  const first = ymOf(input.today);
  const rows: ForecastRow[] = [];
  let balance = input.currentBalance;
  for (const ym of monthsBetween(first, addMonths(first, monthsAhead))) {
    const p = planMonth(input, ym);
    const opening = balance;
    balance += p.incomeRemaining - p.variableRemaining - p.standingUpcoming - p.plannedUpcoming;
    rows.push({ ...p, opening, closing: balance });
  }
  return rows;
}

export interface PointForecast {
  date: string;
  balance: number;
  income: number;
  variableExpenses: number;
  standing: number;
  planned: number;
  events: ForecastEvent[];
}

/**
 * Expected balance at the end of `date`. Monthly targets accrue evenly per day over the
 * open part of each month; standing orders and planned items hit on their exact date.
 */
export function balanceAt(input: ForecastInput, date: string): PointForecast {
  const res: PointForecast = {
    date,
    balance: input.currentBalance,
    income: 0,
    variableExpenses: 0,
    standing: 0,
    planned: 0,
    events: [],
  };
  const target = dayNum(date);
  if (target <= dayNum(input.today)) return res;

  for (const ym of monthsBetween(ymOf(input.today), ymOf(date))) {
    const p = planMonth(input, ym);
    const span = p.windowEnd - p.windowStart;
    if (span > 0) {
      const frac = (Math.min(target, p.windowEnd) - p.windowStart) / span;
      res.income += p.incomeRemaining * frac;
      res.variableExpenses += p.variableRemaining * frac;
    }
    for (const e of p.upcoming) {
      if (dayNum(e.date) > target) continue;
      res.events.push(e);
      if (e.kind === "standing") res.standing += e.amount;
      else res.planned += e.amount;
    }
  }
  res.balance += res.income - res.variableExpenses - res.standing - res.planned;
  return res;
}

export interface TrackingRow {
  month: string;
  incomeTarget: number;
  closings: number;
  /** closings − income target (income is judged on its own, not on profit). */
  incomeDelta: number;
  cumulativeIncomeDelta: number;
  expenseTarget: number;
  expenses: number;
  /** expense target − expenses: positive = spent less than planned. */
  expenseDelta: number;
  cumulativeExpenseDelta: number;
}

/** Target vs. actual for every month from `fromYm` through the current month. */
export function tracking(input: ForecastInput, fromYm: string): TrackingRow[] {
  let cumIncome = 0;
  let cumExpense = 0;
  return monthsBetween(fromYm, ymOf(input.today)).map((ym) => {
    const incomeTarget = targetFor(input.targets, "income", ym);
    const expenseTarget =
      targetFor(input.targets, "expense", ym) +
      eventsInMonth(input, ym).reduce((s, e) => s + e.amount, 0);
    const rec = input.actuals[ym] ?? { closings: 0, expenses: 0 };
    const incomeDelta = rec.closings - incomeTarget;
    const expenseDelta = expenseTarget - rec.expenses;
    cumIncome += incomeDelta;
    cumExpense += expenseDelta;
    return {
      month: ym,
      incomeTarget,
      closings: rec.closings,
      incomeDelta,
      cumulativeIncomeDelta: cumIncome,
      expenseTarget,
      expenses: rec.expenses,
      expenseDelta,
      cumulativeExpenseDelta: cumExpense,
    };
  });
}
