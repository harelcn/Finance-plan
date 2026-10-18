// 100K challenge starting point — the balance math must reproduce the 100K dashboard exactly.
export const BASE_AMOUNT = 20_000;
export const PAYMENTS_START = "2026-05-23"; // payments counted from challenge start
export const EXPENSES_START = "2026-06-01"; // expenses counted from June (by design)
export const TRACKING_START = "2026-06"; // first month in the target-vs-actual table
export const FORECAST_MONTHS = 12;

export const DB_IDS = {
  PAYMENTS: "2f97fd3b-679b-8067-8f5f-cd38c04bb7b8",
  EXPENSES: "2827fd3b-679b-80fb-b609-e1182a8b8633",
  CLOSINGS: "2dd7fd3b-679b-8034-b8d9-df3e7f3d0c3d",
  PLAN: "62536665-e0cf-4c0e-94f2-21e34be0c2fb", // monthly targets
  PLANNED: "545b8a52-e026-4ea3-bdac-6f585973bd3f", // planned expenses + standing orders (linked from הוצאות)
  FUNDS: "ece752a6-c95a-4ea5-b6ff-6660425844bf", // investment funds (TASE security numbers + monthly plan)
  DEPOSITS: "244ad385-ad13-4ecb-979e-fe50def26f6c", // deposits into the portfolio (not expenses)
  CLIENTS: "2a37fd3b-679b-80e0-92e9-f1bdc23ac938", // לידים ולקוחות (title "שם לקוח")
  CATEGORIES: "2827fd3b-679b-81b9-b67b-decc4c0b2903", // expense categories (title "Name")
} as const;

export const PLAN_TYPES = {
  income: "יעד הכנסה",
  expense: "יעד הוצאה",
} as const;

export const PLANNED_TYPES = {
  planned: "הוצאה מתוכננת",
  standing: "הוראת קבע",
} as const;
