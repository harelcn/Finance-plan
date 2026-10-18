import { ymOf } from "./dates";
import type { Bar } from "./tase";
import type { Deposit, Fund } from "./types";

export interface PriceData {
  /** Latest close per fund id. */
  latest: Record<string, Bar | null>;
  /** Close on the deposit date per deposit id. */
  buy: Record<string, Bar | null>;
}

export interface DepositValue {
  deposit: Deposit;
  fund: Fund | undefined;
  units: number | null;
  buyPrice: number | null; // agorot
  value: number; // ₪ today
  gain: number;
  gainPct: number;
  /** false when a price was missing and the value falls back to the amount deposited. */
  priced: boolean;
}

export interface FundValue {
  fund: Fund;
  deposited: number;
  units: number;
  value: number;
  gain: number;
  gainPct: number;
  latest: Bar | null;
  /** Deposited into this fund in the given month (for the monthly plan). */
  depositedThisMonth: number;
}

export interface Portfolio {
  deposits: DepositValue[];
  funds: FundValue[];
  deposited: number;
  value: number;
  gain: number;
  gainPct: number;
}

const pct = (gain: number, base: number) => (base > 0 ? (gain / base) * 100 : 0);

/**
 * Each deposit is valued on its own: units bought at that day's close (or the real units if
 * entered), times the latest close. A June deposit and a July deposit therefore earn different
 * returns, exactly like in the brokerage account.
 */
export function valuePortfolio(funds: Fund[], deposits: Deposit[], prices: PriceData, today: string): Portfolio {
  const byId = new Map(funds.map((f) => [f.id, f]));
  const month = ymOf(today);

  const rows: DepositValue[] = deposits.map((d) => {
    const fund = byId.get(d.fundId);
    const buy = prices.buy[d.id] ?? null;
    const latest = prices.latest[d.fundId] ?? null;
    const units = d.units ?? (buy ? d.amount / (buy.close / 100) : null);
    const priced = units !== null && latest !== null;
    const value = priced ? units! * (latest!.close / 100) : d.amount;
    return {
      deposit: d,
      fund,
      units,
      buyPrice: buy?.close ?? null,
      value,
      gain: value - d.amount,
      gainPct: pct(value - d.amount, d.amount),
      priced,
    };
  });

  const fundRows: FundValue[] = funds.map((f) => {
    const mine = rows.filter((r) => r.deposit.fundId === f.id);
    const deposited = mine.reduce((s, r) => s + r.deposit.amount, 0);
    const value = mine.reduce((s, r) => s + r.value, 0);
    return {
      fund: f,
      deposited,
      units: mine.reduce((s, r) => s + (r.units ?? 0), 0),
      value,
      gain: value - deposited,
      gainPct: pct(value - deposited, deposited),
      latest: prices.latest[f.id] ?? null,
      depositedThisMonth: mine.filter((r) => ymOf(r.deposit.date) === month).reduce((s, r) => s + r.deposit.amount, 0),
    };
  });

  const deposited = rows.reduce((s, r) => s + r.deposit.amount, 0);
  const value = rows.reduce((s, r) => s + r.value, 0);
  return { deposits: rows, funds: fundRows, deposited, value, gain: value - deposited, gainPct: pct(value - deposited, deposited) };
}
