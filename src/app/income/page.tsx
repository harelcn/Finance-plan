import { IncomeView } from "@/components/Ledger";
import { PageTitle } from "@/components/ui";
import { loadData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function IncomePage() {
  const { today, actuals } = await loadData();
  return (
    <>
      <PageTitle title="פירוט הכנסות" />
      <IncomeView payments={actuals.paymentRows} closings={actuals.closingRows} today={today} />
    </>
  );
}
