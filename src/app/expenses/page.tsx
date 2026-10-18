import { ExpensesView } from "@/components/Ledger";
import { PageTitle } from "@/components/ui";
import { loadData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const { today, actuals } = await loadData();
  return (
    <>
      <PageTitle title="פירוט הוצאות" />
      <ExpensesView rows={actuals.expenseRows} today={today} />
    </>
  );
}
