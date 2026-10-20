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

const sumAmounts = (xs: { amount: number }[]) => xs.reduce((s, x) => s + x.amount, 0);
const sumDue = (xs: ForecastEvent[]) => xs.reduce((s, e) => s + e.due, 0);

/** A standing order's charge in `ym`; only expenses linked to it in that month count as charged. */
function standingEvents(orders: StandingOrder[], ym: string): ForecastEvent[] {
  const out: ForecastEvent[] = [];
  for (const o of orders) {
    if (ymOf(o.start) > ym) continue;
    if (o.end && ymOf(o.end) < ym) continue;
    const date = dateInMonth(ym, Number(o.start.slice(8, 10)));
    if (date < o.start || (o.end && date > o.end)) continue;
    const paid = sumAmounts((o.payments ?? []).filter((p) => ymOf(p.date) === ym));
    out.push({ itemId: o.id, date, name: o.name, amount: o.amount, due: Math.max(0, o.amount - paid), kind: "standing" });
  }
  return out;
}

/**
 * Full installment schedule of a planned expense. Everything linked to it so far is applied
 * to installments in order, so paying early or in one go both work.
 */
export function plannedSchedule(p: PlannedExpense): ForecastEvent[] {
  const n = Math.max(1, Math.round(p.installments || 1));
  const per = p.amount / n;
  let pool = sumAmounts(p.payments ?? []);
  const first = ymOf(p.date);
  const out: ForecastEvent[] = [];
  for (let k = 0; k < n; k++) {
    const covered = Math.min(per, Math.max(0, pool));
    pool -= covered;
    out.push({
      itemId: p.id,
      date: dateInMonth(addMonths(first, k), Number(p.date.slice(8, 10))),
      name: p.name,
      amount: per,
      due: Math.max(0, per - covered),
      kind: "planned",
      installment: n > 1 ? { index: k + 1, of: n } : undefined,
    });
  }
  return out;
}

/** Every standing-order charge and planned installment scheduled in `ym`. */
export function eventsInMonth(s: PlanSettings, ym: string): ForecastEvent[] {
  return [
    ...standingEvents(s.standing, ym),
    ...s.planned.flatMap(plannedSchedule).filter((e) => ymOf(e.date) === ym),
  ].sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Charges whose date passed with no linked expense covering them ("טרם יצא").
 * Nothing counts as done until it is recorded in Notion and linked.
 * Planned installments from any month; standing orders for the current month.
 */
export function overdueEvents(s: PlanSettings, today: string): ForecastEvent[] {
  return [...standingEvents(s.standing, ymOf(today)), ...s.planned.flatMap(plannedSchedule)]
    .filter((e) => e.date <= today && e.due > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Expenses in `ym` linked to a plan item (so they are not variable spending). */
export function linkedInMonth(s: PlanSettings, ym: string): number {
  return sumAmounts(
    [...s.planned, ...s.standing].flatMap((i) => i.payments ?? []).filter((p) => ymOf(p.date) === ym),
  );
}

export interface MonthPlan {
  month: string;
  incomeTarget: number;
  variableTarget: number;
  expenseTarget: number; // variable target + every planned/standing charge scheduled in the month
  recordedClosings: number;
  recordedExpenses: number;
  /** Recorded expenses that are not linked to any plan item. */
  variableRecorded: number;
  /** Income still expected after `today` (target minus what is already closed). */
  incomeRemaining: number;
  /** Variable spending still expected after `today` (target minus unlinked spending so far). */
  variableRemaining: number;
  /** Charges still to go out: future-dated ones, plus overdue ones in the current month. */
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
 * gap to the target (and charges not yet linked to a real expense) is added.
 */
export function planMonth(input: ForecastInput, ym: string): MonthPlan {
  const today = dayNum(input.today);
  const isCurrent = ym === ymOf(input.today);
  const events = eventsInMonth(input, ym);
  const upcoming = [
    ...(isCurrent ? overdueEvents(input, input.today) : []),
    ...events.filter((e) => e.due > 0 && dayNum(e.date) > today),
  ];
  const incomeTarget = targetFor(input.targets, "income", ym);
  const variableTarget = targetFor(input.targets, "expense", ym);
  const rec = input.actuals[ym] ?? { closings: 0, expenses: 0 };
  const variableRecorded = Math.max(0, rec.expenses - linkedInMonth(input, ym));

  const windowStart = Math.max(today, dayNum(monthStart(ym)) - 1);
  const windowEnd = dayNum(monthEnd(ym));
  const open = windowEnd > windowStart;

  return {
    month: ym,
    incomeTarget,
    variableTarget,
    expenseTarget: variableTarget + sumAmounts(events),
    recordedClosings: rec.closings,
    recordedExpenses: rec.expenses,
    variableRecorded,
    incomeRemaining: open ? Math.max(0, incomeTarget - rec.closings) : 0,
    variableRemaining: open ? Math.max(0, variableTarget - variableRecorded) : 0,
    upcoming,
    standingUpcoming: sumDue(upcoming.filter((e) => e.kind === "standing")),
    plannedUpcoming: sumDue(upcoming.filter((e) => e.kind === "planned")),
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
 * open part of each month; charges hit on their date (overdue ones right away).
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
  const today = dayNum(input.today);
  if (target <= today) return res;

  for (const ym of monthsBetween(ymOf(input.today), ymOf(date))) {
    const p = planMonth(input, ym);
    const span = p.windowEnd - p.windowStart;
    if (span > 0) {
      const frac = (Math.min(target, p.windowEnd) - p.windowStart) / span;
      res.income += p.incomeRemaining * frac;
      res.variableExpenses += p.variableRemaining * frac;
    }
    for (const e of p.upcoming) {
      if (Math.max(dayNum(e.date), today + 1) > target) continue;
      res.events.push(e);
      if (e.kind === "standing") res.standing += e.due;
      else res.planned += e.due;
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
  /** A month without a target shows actuals only and stays out of the running deltas. */
  hasIncomeTarget: boolean;
  hasExpenseTarget: boolean;
}

/**
 * Target vs. actual for every month from `fromYm` through the current month.
 * Running totals are the plain sum of every month's gap, the current month included as it stands.
 */
export function tracking(input: ForecastInput, fromYm: string): TrackingRow[] {
  let cumIncome = 0;
  let cumExpense = 0;
  return monthsBetween(fromYm, ymOf(input.today)).map((ym) => {
    const incomeTarget = targetFor(input.targets, "income", ym);
    const variableTarget = targetFor(input.targets, "expense", ym);
    const expenseTarget = variableTarget + eventsInMonth(input, ym).reduce((s, e) => s + e.amount, 0);
    const rec = input.actuals[ym] ?? { closings: 0, expenses: 0 };
    const hasIncomeTarget = incomeTarget > 0;
    const hasExpenseTarget = variableTarget > 0;
    const incomeDelta = hasIncomeTarget ? rec.closings - incomeTarget : 0;
    const expenseDelta = hasExpenseTarget ? expenseTarget - rec.expenses : 0;
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
      hasIncomeTarget,
      hasExpenseTarget,
    };
  });
}
