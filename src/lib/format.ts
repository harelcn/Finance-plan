export function fmt(n: number): string {
  const r = Math.round(n);
  return (r < 0 ? "−₪" : "₪") + Math.abs(r).toLocaleString("he-IL");
}

export function signed(n: number): string {
  return (n > 0 ? "+" : "") + fmt(n);
}

export function pct(part: number, whole: number): number {
  return whole > 0 ? (part / whole) * 100 : 0;
}

/** Today's date in Israel, YYYY-MM-DD. */
export function todayIL(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date());
}
