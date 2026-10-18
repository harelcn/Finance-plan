import { DB_IDS, PLAN_TYPES, PLANNED_TYPES } from "./config";
import { notion, queryAll } from "./notion";
import type { PlanSettings, PlannedExpense, StandingOrder, Target } from "./types";

const text = (p: any): string => p?.title?.[0]?.plain_text ?? p?.rich_text?.[0]?.plain_text ?? ""; // eslint-disable-line @typescript-eslint/no-explicit-any

/** Targets from "תכנון פיננסי"; planned expenses + standing orders from "הוצאות מתוכננות". */
export async function getPlan(): Promise<PlanSettings> {
  const [targetRows, itemRows] = await Promise.all([
    queryAll(DB_IDS.PLAN, { property: "פעיל", checkbox: { equals: true } }),
    queryAll(DB_IDS.PLANNED),
  ]);
  const plan: PlanSettings = { targets: [], planned: [], standing: [] };

  for (const r of itemRows) {
    const p = r.properties;
    const date: string = p["תאריך"]?.date?.start?.slice(0, 10) ?? "";
    if (!date) continue;
    const base = { id: r.id, name: text(p["Name"]), amount: p["סכום"]?.number ?? 0, notes: text(p["Notes"]) };
    if (p["סוג"]?.select?.name === PLANNED_TYPES.standing) {
      plan.standing.push({ ...base, start: date, end: p["תאריך סיום"]?.date?.start?.slice(0, 10) ?? null });
    } else {
      plan.planned.push({ ...base, date, installments: p["תשלומים"]?.number ?? 1 });
    }
  }

  for (const r of targetRows) {
    const p = r.properties;
    const type: string = p["סוג"]?.select?.name ?? "";
    const from: string = p["תאריך"]?.date?.start?.slice(0, 10) ?? "";
    if (!from || (type !== PLAN_TYPES.income && type !== PLAN_TYPES.expense)) continue;
    plan.targets.push({ id: r.id, kind: type === PLAN_TYPES.income ? "income" : "expense", amount: p["סכום"]?.number ?? 0, from });
  }

  plan.targets.sort((a, b) => a.from.localeCompare(b.from));
  plan.planned.sort((a, b) => a.date.localeCompare(b.date));
  plan.standing.sort((a, b) => a.start.localeCompare(b.start));
  return plan;
}

const dateProp = (d: string | null) => ({ date: d ? { start: d } : null });
const notesProp = (n?: string) => ({ rich_text: n ? [{ text: { content: n } }] : [] });

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
      "סוג": { select: { name: PLANNED_TYPES.planned } },
      "סכום": { number: p.amount },
      "תאריך": dateProp(p.date),
      "תשלומים": { number: p.installments },
      Notes: notesProp(p.notes),
    },
  });
}

export async function createStanding(s: Omit<StandingOrder, "id">) {
  await notion.pages.create({
    parent: { database_id: DB_IDS.PLANNED },
    properties: {
      Name: { title: [{ text: { content: s.name } }] },
      "סוג": { select: { name: PLANNED_TYPES.standing } },
      "סכום": { number: s.amount },
      "תאריך": dateProp(s.start),
      "תאריך סיום": dateProp(s.end),
      Notes: notesProp(s.notes),
    },
  });
}

/** Moves the row to Notion's trash (restorable from there). */
export async function archiveRow(id: string) {
  await notion.pages.update({ page_id: id, archived: true });
}
