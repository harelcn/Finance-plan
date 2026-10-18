import { DB_IDS } from "./config";
import { notion, queryAll } from "./notion";
import type { Deposit, Fund } from "./types";

const text = (p: any): string => p?.title?.[0]?.plain_text ?? p?.rich_text?.[0]?.plain_text ?? ""; // eslint-disable-line @typescript-eslint/no-explicit-any

export async function getFunds(): Promise<Fund[]> {
  const rows = await queryAll(DB_IDS.FUNDS, { property: "פעיל", checkbox: { equals: true } });
  return rows
    .map((r) => ({
      id: r.id as string,
      name: text(r.properties["Name"]),
      securityId: text(r.properties["מספר נייר"]).trim(),
      monthly: r.properties["הפקדה חודשית"]?.number ?? 0,
      day: r.properties["יום הפקדה"]?.number ?? null,
    }))
    .filter((f) => f.securityId);
}

export async function getDeposits(): Promise<Deposit[]> {
  const rows = await queryAll(DB_IDS.DEPOSITS);
  return rows
    .map((r) => ({
      id: r.id as string,
      fundId: (r.properties["קרן"]?.relation?.[0]?.id as string) ?? "",
      amount: r.properties["סכום"]?.number ?? 0,
      date: (r.properties["תאריך"]?.date?.start as string)?.slice(0, 10) ?? "",
      units: r.properties["יחידות"]?.number ?? null,
      notes: text(r.properties["Notes"]),
    }))
    .filter((d) => d.fundId && d.date && d.amount > 0)
    .sort((a, b) => b.date.localeCompare(a.date));
}

function depositProps(d: Omit<Deposit, "id">, fundName: string) {
  return {
    Name: { title: [{ text: { content: `${fundName} · ${d.date}` } }] },
    "קרן": { relation: [{ id: d.fundId }] },
    "סכום": { number: d.amount },
    "תאריך": { date: { start: d.date } },
    "יחידות": { number: d.units },
  };
}

export async function createDeposit(d: Omit<Deposit, "id">, fundName: string) {
  await notion.pages.create({ parent: { database_id: DB_IDS.DEPOSITS }, properties: depositProps(d, fundName) });
}

export async function updateDeposit(id: string, d: Omit<Deposit, "id">, fundName: string) {
  await notion.pages.update({ page_id: id, properties: depositProps(d, fundName) });
}

/** Only the plan is editable from the app; name / security number live in Notion. */
export async function updateFundPlan(id: string, monthly: number, day: number | null) {
  await notion.pages.update({
    page_id: id,
    properties: { "הפקדה חודשית": { number: monthly }, "יום הפקדה": { number: day } },
  });
}
