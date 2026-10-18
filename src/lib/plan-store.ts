import { DB_IDS, PLAN_TYPES } from "./config";
import { notion, queryAll } from "./notion";
import type { PlanSettings, PlannedExpense, StandingOrder, Target } from "./types";

const text = (p: any): string => p?.title?.[0]?.plain_text ?? p?.rich_text?.[0]?.plain_text ?? ""; // eslint-disable-line @typescript-eslint/no-explicit-any

/** Targets + standing orders from "תכנון פיננסי", planned expenses from "הוצאות מתוכננות". */
export async function getPlan(): Promise<PlanSettings> {
  const [rows, plannedRows] = await Promise.all([
    queryAll(DB_IDS.PLAN, { property: "פעיל", checkbox: { equals: true } }),
    queryAll(DB_IDS.PLANNED),
  ]);
  const plan: PlanSettings = { targets: [], planned: [], standing: [] };

  for (const r of plannedRows) {
    const p = r.properties;
    const date: string = p["תאריך"]?.date?.start?.slice(0, 10) ?? "";
    if (!date) continue;
    plan.planned.push({
      id: r.id,
      name: text(p["Name"]),
      amount: p["סכום"]?.number ?? 0,
      date,
      installments: p["תשלומים"]?.number ?? 1,
      notes: text(p["Notes"]),
    });
  }

  for (const r of rows) {
    const p = r.properties;
    const type: string = p["סוג"]?.select?.name ?? "";
    const amount: number = p["סכום"]?.number ?? 0;
    const date: string = p["תאריך"]?.date?.start?.slice(0, 10) ?? "";
    const name = text(p["Name"]);
    const notes = text(p["Notes"]);
    if (!date) continue;

    if (type === PLAN_TYPES.income || type === PLAN_TYPES.expense) {
      plan.targets.push({ id: r.id, kind: type === PLAN_TYPES.income ? "income" : "expense", amount, from: date });
    } else if (type === PLAN_TYPES.standing) {
      const end: string | null = p["תאריך סיום"]?.date?.start?.slice(0, 10) ?? null;
      plan.standing.push({ id: r.id, name, amount, start: date, end, notes });
    }
  }

  plan.targets.sort((a, b) => a.from.localeCompare(b.from));
  plan.planned.sort((a, b) => a.date.localeCompare(b.date));
  plan.standing.sort((a, b) => a.start.localeCompare(b.start));
  return plan;
}

const dateProp = (d: string | null) => ({ date: d ? { start: d } : null });

export async function createTarget(t: Omit<Target, "id">) {
  await notion.pages.create({
    parent: { database_id: DB_IDS.PLAN },
    properties: {
      Name: { title: [{ text: { content: t.kind === "income" ? "יעד הכנסה חודשי" : "יעד הוצאה חודשי" } }] },
      "סוג": { select: { name: PLAN_TYPES[t.kind] } },
      "סכום": { number: t.amount },
      "תאריך": dateProp(t.from),
      "פעיל": { checkbox: true },
    },
  });
}

export async function createPlanned(p: Omit<PlannedExpense, "id">) {
  await notion.pages.create({
    parent: { database_id: DB_IDS.PLANNED },
    properties: {
      Name: { title: [{ text: { content: p.name } }] },
      "סכום": { number: p.amount },
      "תאריך": dateProp(p.date),
      "תשלומים": { number: p.installments },
      Notes: { rich_text: p.notes ? [{ text: { content: p.notes } }] : [] },
    },
  });
}

export async function createStanding(s: Omit<StandingOrder, "id">) {
  await notion.pages.create({
    parent: { database_id: DB_IDS.PLAN },
    properties: {
      Name: { title: [{ text: { content: s.name } }] },
      "סוג": { select: { name: PLAN_TYPES.standing } },
      "סכום": { number: s.amount },
      "תאריך": dateProp(s.start),
      "תאריך סיום": dateProp(s.end),
      "פעיל": { checkbox: true },
      Notes: { rich_text: s.notes ? [{ text: { content: s.notes } }] : [] },
    },
  });
}

/** Moves the row to Notion's trash (restorable from there). */
export async function archiveRow(id: string) {
  await notion.pages.update({ page_id: id, archived: true });
}
