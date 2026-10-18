import { describe, expect, it } from "vitest";
import { addMonths, daysInMonth } from "../src/lib/dates";
import {
  balanceAt,
  eventsInMonth,
  forecastMonths,
  planMonth,
  targetFor,
  tracking,
  type ForecastInput,
} from "../src/lib/forecast";

const base: ForecastInput = {
  today: "2026-10-18",
  currentBalance: 100_000,
  actuals: {},
  targets: [
    { id: "i", kind: "income", amount: 10_000, from: "2026-06-01" },
    { id: "e", kind: "expense", amount: 3_000, from: "2026-06-01" },
  ],
  planned: [],
  standing: [],
};

describe("dates", () => {
  it("adds months across years", () => {
    expect(addMonths("2026-11", 3)).toBe("2027-02");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
  });
  it("knows month lengths", () => {
    expect(daysInMonth("2026-02")).toBe(28);
    expect(daysInMonth("2028-02")).toBe(29);
  });
});

describe("targetFor", () => {
  it("uses the latest target that already started", () => {
    const targets = [
      ...base.targets,
      { id: "i2", kind: "income" as const, amount: 20_000, from: "2027-01-15" },
    ];
    expect(targetFor(targets, "income", "2026-12")).toBe(10_000);
    expect(targetFor(targets, "income", "2027-01")).toBe(20_000);
    expect(targetFor(targets, "income", "2026-05")).toBe(0);
  });
});

describe("eventsInMonth", () => {
  it("splits installments over consecutive months", () => {
    const s = { ...base, planned: [{ id: "p", name: "חתונה", amount: 9_000, date: "2026-11-10", installments: 3 }] };
    expect(eventsInMonth(s, "2026-10")).toHaveLength(0);
    expect(eventsInMonth(s, "2026-11")[0]).toMatchObject({ amount: 3_000, date: "2026-11-10" });
    expect(eventsInMonth(s, "2027-01")[0].installment).toEqual({ index: 3, of: 3 });
    expect(eventsInMonth(s, "2027-02")).toHaveLength(0);
  });
  it("respects standing order start/end and clamps the day", () => {
    const s = { ...base, standing: [{ id: "s", name: "ביטוח", amount: 200, start: "2026-10-31", end: "2027-01-31" }] };
    expect(eventsInMonth(s, "2026-11")[0].date).toBe("2026-11-30");
    expect(eventsInMonth(s, "2027-01")).toHaveLength(1);
    expect(eventsInMonth(s, "2027-02")).toHaveLength(0);
  });
});

describe("planMonth", () => {
  it("adds only the income gap for the current month", () => {
    const p = planMonth({ ...base, actuals: { "2026-10": { closings: 7_000, expenses: 1_000 } } }, "2026-10");
    expect(p.incomeRemaining).toBe(3_000);
    expect(p.variableRemaining).toBe(2_000);
  });
  it("never goes negative when the target was beaten", () => {
    const p = planMonth({ ...base, actuals: { "2026-10": { closings: 25_000, expenses: 9_000 } } }, "2026-10");
    expect(p.incomeRemaining).toBe(0);
    expect(p.variableRemaining).toBe(0);
  });
  it("still charges a future standing order even after overspending", () => {
    const p = planMonth(
      {
        ...base,
        actuals: { "2026-10": { closings: 0, expenses: 5_000 } },
        standing: [{ id: "s", name: "שכירות", amount: 4_000, start: "2026-06-25", end: null }],
      },
      "2026-10",
    );
    expect(p.standingUpcoming).toBe(4_000);
    expect(p.variableRemaining).toBe(0);
  });
  it("does not re-charge items dated before today (already in Notion expenses)", () => {
    const p = planMonth(
      { ...base, standing: [{ id: "s", name: "מנוי", amount: 100, start: "2026-06-05", end: null }] },
      "2026-10",
    );
    expect(p.upcoming).toHaveLength(0);
    expect(p.expenseTarget).toBe(3_100);
  });
});

describe("forecastMonths", () => {
  it("rolls the balance forward for 13 rows", () => {
    const rows = forecastMonths(base, 12);
    expect(rows).toHaveLength(13);
    expect(rows[1].opening).toBe(rows[0].closing);
    // a full future month adds income - expense
    expect(rows[1].closing - rows[1].opening).toBe(7_000);
  });
  it("subtracts a lump planned expense in its month", () => {
    const rows = forecastMonths({
      ...base,
      planned: [{ id: "p", name: "רכב", amount: 30_000, date: "2027-03-01", installments: 1 }],
    });
    const march = rows.find((r) => r.month === "2027-03")!;
    expect(march.closing - march.opening).toBe(7_000 - 30_000);
  });
});

describe("balanceAt", () => {
  it("returns today's balance for today or earlier", () => {
    expect(balanceAt(base, "2026-10-18").balance).toBe(100_000);
    expect(balanceAt(base, "2026-01-01").balance).toBe(100_000);
  });
  it("matches the month table at month end", () => {
    const rows = forecastMonths(base, 12);
    expect(balanceAt(base, "2027-04-30").balance).toBeCloseTo(rows.find((r) => r.month === "2027-04")!.closing);
  });
  it("prorates the open part of the current month", () => {
    // 13 days open (19-31). halfway-ish: 6 of 13 days
    const r = balanceAt(base, "2026-10-24");
    expect(r.income).toBeCloseTo((10_000 * 6) / 13);
  });
  it("hits a planned item only once its date arrives", () => {
    const s = { ...base, planned: [{ id: "p", name: "x", amount: 1_000, date: "2026-11-15", installments: 1 }] };
    expect(balanceAt(s, "2026-11-14").planned).toBe(0);
    expect(balanceAt(s, "2026-11-15").planned).toBe(1_000);
  });
});

describe("tracking", () => {
  it("judges income and expenses separately, each with a running delta", () => {
    const rows = tracking(
      {
        ...base,
        actuals: {
          "2026-06": { closings: 12_000, expenses: 3_000 },
          "2026-07": { closings: 8_000, expenses: 4_000 },
        },
      },
      "2026-06",
    );
    // income only vs income target — expenses don't touch it
    expect(rows[0].incomeDelta).toBe(2_000);
    expect(rows[1].incomeDelta).toBe(-2_000);
    expect(rows[1].cumulativeIncomeDelta).toBe(0);
    // expenses vs expense target, positive = under budget
    expect(rows[0].expenseDelta).toBe(0);
    expect(rows[1].expenseDelta).toBe(-1_000);
    expect(rows[1].cumulativeExpenseDelta).toBe(-1_000);
    expect(rows.at(-1)!.month).toBe("2026-10");
  });
});
