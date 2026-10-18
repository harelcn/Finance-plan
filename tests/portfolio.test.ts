import { describe, expect, it } from "vitest";
import { valuePortfolio } from "../src/lib/portfolio";
import type { Deposit, Fund } from "../src/lib/types";

const spx: Fund = { id: "f1", name: "S&P 500", securityId: "1183441", monthly: 1_000, day: 10 };
const today = "2026-10-18";

describe("valuePortfolio", () => {
  it("values each deposit by its own buy-day price", () => {
    const deposits: Deposit[] = [
      { id: "d1", fundId: "f1", amount: 1_000, date: "2026-06-10", units: null },
      { id: "d2", fundId: "f1", amount: 1_000, date: "2026-07-10", units: null },
    ];
    const p = valuePortfolio([spx], deposits, {
      latest: { f1: { date: "2026-10-16", close: 4_800 } }, // ₪48
      buy: { d1: { date: "2026-06-10", close: 4_000 }, d2: { date: "2026-07-10", close: 4_800 } },
    }, today);
    expect(p.deposits[0].value).toBeCloseTo(1_200); // +20%
    expect(p.deposits[1].value).toBeCloseTo(1_000); // flat
    expect(p.deposited).toBe(2_000);
    expect(p.value).toBeCloseTo(2_200);
    expect(p.gainPct).toBeCloseTo(10);
  });

  it("prefers the real units when entered", () => {
    const p = valuePortfolio([spx], [{ id: "d1", fundId: "f1", amount: 1_000, date: "2026-06-10", units: 30 }], {
      latest: { f1: { date: "2026-10-16", close: 5_000 } },
      buy: { d1: { date: "2026-06-10", close: 4_000 } },
    }, today);
    expect(p.deposits[0].value).toBeCloseTo(1_500);
  });

  it("falls back to the amount deposited when a price is missing", () => {
    const p = valuePortfolio([spx], [{ id: "d1", fundId: "f1", amount: 1_000, date: "2026-06-10", units: null }], {
      latest: { f1: null },
      buy: { d1: null },
    }, today);
    expect(p.value).toBe(1_000);
    expect(p.deposits[0].priced).toBe(false);
  });

  it("tracks what went into each fund this month", () => {
    const p = valuePortfolio([spx], [
      { id: "d1", fundId: "f1", amount: 600, date: "2026-10-10", units: null },
      { id: "d2", fundId: "f1", amount: 1_000, date: "2026-09-10", units: null },
    ], { latest: { f1: null }, buy: {} }, today);
    expect(p.funds[0].depositedThisMonth).toBe(600);
  });
});
