import { unstable_cache } from "next/cache";
import { dayNum, fromDayNum } from "./dates";

/**
 * Daily closing prices from the Tel Aviv Stock Exchange (the same endpoint tase.co.il uses).
 * Prices are in agorot. `AdjustmentRate` is the adjusted close, so splits/distributions don't
 * show up as fake jumps.
 */
const ENDPOINT = "https://api.tase.co.il/api/security/historyeod";

export interface Bar {
  date: string; // YYYY-MM-DD
  close: number; // agorot
}

interface TaseItem {
  TradeDate: string; // DD/MM/YYYY
  AdjustmentRate: number | null;
  CloseRate: number | null;
}

function toIso(d: string): string {
  const [dd, mm, yyyy] = d.split("/");
  return `${yyyy}-${mm}-${dd}`;
}

async function fetchPage(securityId: string, from: string, to: string, page: number) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    // TASE's firewall rejects (403) requests that don't look like its own website.
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "he-IL,he;q=0.9,en;q=0.8",
      Referer: "https://www.tase.co.il/",
      Origin: "https://www.tase.co.il",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
    },
    body: JSON.stringify({ dFrom: from, dTo: to, oId: securityId, pType: "8", TotalRec: 1, pageNum: page, lang: "0" }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`TASE ${res.status}`);
  return (await res.json()) as { Items?: TaseItem[]; TotalRec?: number };
}

/** Newest-first bars between two dates (inclusive). */
async function history(securityId: string, from: string, to: string): Promise<Bar[]> {
  const bars: Bar[] = [];
  for (let page = 1; page <= 20; page++) {
    const d = await fetchPage(securityId, from, to, page);
    const items = d.Items ?? [];
    for (const it of items) {
      const close = it.AdjustmentRate ?? it.CloseRate;
      if (close) bars.push({ date: toIso(it.TradeDate), close });
    }
    if (!items.length || bars.length >= (d.TotalRec ?? 0)) break;
  }
  return bars;
}

/** Last close on or before `date` (deposits on a holiday/weekend use the previous trading day). */
async function closeOnRaw(securityId: string, date: string): Promise<Bar | null> {
  const from = fromDayNum(dayNum(date) - 10);
  const bars = await history(securityId, from, date);
  return bars[0] ?? null;
}

/** Most recent close (cached for an hour). `today` is part of the cache key. */
async function latestRaw(securityId: string, today: string): Promise<Bar | null> {
  const bars = await history(securityId, fromDayNum(dayNum(today) - 14), today);
  return bars[0] ?? null;
}

// Historical closes never change → cache for a week. Latest close → 1 hour.
const closeOnCached = unstable_cache(closeOnRaw, ["tase-close-on"], { revalidate: 7 * 24 * 3600 });
const latestCached = unstable_cache(latestRaw, ["tase-latest"], { revalidate: 3600 });

export async function closeOn(securityId: string, date: string): Promise<Bar | null> {
  try {
    return await closeOnCached(securityId, date);
  } catch (e) {
    console.error("TASE closeOn failed", securityId, date, e);
    return null;
  }
}

export async function latestClose(securityId: string, today: string): Promise<Bar | null> {
  try {
    return await latestCached(securityId, today);
  } catch (e) {
    console.error("TASE latest failed", securityId, e);
    return null;
  }
}
