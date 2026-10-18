"use server";
import { revalidatePath } from "next/cache";
import { archiveRow, createPlanned, createStanding, createTarget } from "@/lib/plan-store";

export interface ActionState {
  error?: string;
  ok?: number; // bumps on success so forms can reset
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function readAmount(fd: FormData, key = "amount"): number | null {
  const n = Number(String(fd.get(key) ?? "").replace(/[,₪\s]/g, ""));
  return Number.isFinite(n) && n > 0 && n < 100_000_000 ? n : null;
}

function readDate(fd: FormData, key: string): string | null {
  const v = String(fd.get(key) ?? "");
  return DATE_RE.test(v) ? v : null;
}

function readName(fd: FormData): string | null {
  const v = String(fd.get("name") ?? "").trim();
  return v && v.length <= 120 ? v : null;
}

async function run(fn: () => Promise<void>): Promise<ActionState> {
  try {
    await fn();
    revalidatePath("/", "layout");
    return { ok: Date.now() };
  } catch (e) {
    console.error(e);
    return { error: "השמירה נכשלה" };
  }
}

export async function addTarget(_: ActionState, fd: FormData): Promise<ActionState> {
  const kind = fd.get("kind") === "income" ? "income" : "expense";
  const amount = readAmount(fd);
  const from = readDate(fd, "from");
  if (!amount || !from) return { error: "צריך סכום ותאריך התחלה" };
  return run(() => createTarget({ kind, amount, from }));
}

export async function addPlanned(_: ActionState, fd: FormData): Promise<ActionState> {
  const name = readName(fd);
  const amount = readAmount(fd);
  const date = readDate(fd, "date");
  const split = fd.get("mode") === "installments";
  const installments = split ? Math.round(Number(fd.get("installments"))) : 1;
  if (!name || !amount || !date) return { error: "צריך שם, סכום ותאריך" };
  if (!Number.isFinite(installments) || installments < 1 || installments > 120)
    return { error: "מספר תשלומים בין 1 ל-120" };
  const notes = String(fd.get("notes") ?? "").trim().slice(0, 500);
  return run(() => createPlanned({ name, amount, date, installments, notes }));
}

export async function addStanding(_: ActionState, fd: FormData): Promise<ActionState> {
  const name = readName(fd);
  const amount = readAmount(fd);
  const start = readDate(fd, "start");
  const end = readDate(fd, "end");
  if (!name || !amount || !start) return { error: "צריך שם, סכום חודשי ותאריך התחלה" };
  if (end && end < start) return { error: "תאריך הסיום לפני ההתחלה" };
  return run(() => createStanding({ name, amount, start, end }));
}

export async function removeRow(id: string): Promise<ActionState> {
  if (!/^[0-9a-f-]{32,36}$/i.test(id)) return { error: "מזהה לא תקין" };
  return run(() => archiveRow(id));
}
