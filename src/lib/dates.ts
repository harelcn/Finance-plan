// All dates are "YYYY-MM-DD" strings, months are "YYYY-MM". Math is done in UTC day numbers
// so results never depend on the server's timezone.

const DAY_MS = 86_400_000;

export function dayNum(date: string): number {
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
}

export function fromDayNum(n: number): string {
  return new Date(n * DAY_MS).toISOString().slice(0, 10);
}

export function ymOf(date: string): string {
  return date.slice(0, 7);
}

export function addMonths(ym: string, n: number): string {
  const [y, m] = ym.split("-").map(Number);
  const total = y * 12 + (m - 1) + n;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

export function daysInMonth(ym: string): number {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function monthStart(ym: string): string {
  return `${ym}-01`;
}

export function monthEnd(ym: string): string {
  return `${ym}-${String(daysInMonth(ym)).padStart(2, "0")}`;
}

/** Same day-of-month as `day`, clamped to the month's length. */
export function dateInMonth(ym: string, day: number): string {
  const d = Math.min(day, daysInMonth(ym));
  return `${ym}-${String(d).padStart(2, "0")}`;
}

export function monthsBetween(fromYm: string, toYm: string): string[] {
  const out: string[] = [];
  for (let m = fromYm; m <= toYm; m = addMonths(m, 1)) out.push(m);
  return out;
}

const HE_MONTHS = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

export function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${HE_MONTHS[m - 1]} ${y}`;
}

export function dateLabel(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return `${d}.${m}.${y}`;
}
