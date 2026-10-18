"use client";
import { useActionState, useState } from "react";
import { saveDeposit, saveFundPlan } from "@/app/actions";
import type { Deposit, Fund } from "@/lib/types";
import { DeleteButton, FormError, input, label, Submit, useAfterSuccess } from "./Forms";
import { Icon } from "./Icon";

export function DepositForm({ funds, today, initial, onDone }: {
  funds: Fund[]; today: string; initial?: Deposit; onDone?: () => void;
}) {
  const [state, action, pending] = useActionState(saveDeposit, {});
  const ref = useAfterSuccess(state, onDone);
  return (
    <form ref={ref} action={action} className="space-y-4">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 [&>*]:min-w-0">
        <label className={label}>
          <span>קרן</span>
          <select name="fundId" defaultValue={initial?.fundId ?? funds[0]?.id} className={input} required>
            {funds.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </label>
        <label className={label}>
          <span>סכום שהופקד</span>
          <input name="amount" inputMode="decimal" defaultValue={initial?.amount} className={input} required />
        </label>
        <label className={label}>
          <span>תאריך</span>
          <input name="date" type="date" defaultValue={initial?.date ?? today} className={input} required />
        </label>
        <label className={label}>
          <span>יחידות שנקנו (לא חובה)</span>
          <input name="units" inputMode="decimal" defaultValue={initial?.units ?? undefined} className={input} />
        </label>
      </div>
      <FormError state={state} />
      <Submit pending={pending}>{initial ? "שמור שינויים" : "הוסף הפקדה"}</Submit>
    </form>
  );
}

export function FundPlanForm({ fund, onDone }: { fund: Fund; onDone?: () => void }) {
  const [state, action, pending] = useActionState(saveFundPlan, {});
  const ref = useAfterSuccess(state, onDone);
  return (
    <form ref={ref} action={action} className="space-y-4">
      <input type="hidden" name="id" value={fund.id} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 [&>*]:min-w-0">
        <label className={label}>
          <span>הפקדה חודשית</span>
          <input name="monthly" inputMode="decimal" defaultValue={fund.monthly || undefined} className={input} />
        </label>
        <label className={label}>
          <span>יום בחודש</span>
          <input name="day" type="number" min={1} max={31} defaultValue={fund.day ?? undefined} className={input} />
        </label>
      </div>
      <FormError state={state} />
      <Submit pending={pending}>שמור תכנית</Submit>
    </form>
  );
}

/** Row + pencil that opens the deposit (or fund-plan) form under it. */
export function EditablePortfolioRow({ row, today, funds, deposit, fund }: {
  row: React.ReactNode; today: string; funds: Fund[]; deposit?: Deposit; fund?: Fund;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <div>
      <div className="flex items-center gap-1">
        <div className="flex-1 min-w-0">{row}</div>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="ערוך"
          className={`w-8 h-8 grid place-items-center rounded-full hover:bg-ink/10 ${open ? "text-ink bg-ink/10" : "text-faint hover:text-ink"}`}
        >
          <Icon name="edit" className="w-4 h-4" />
        </button>
        {deposit && <DeleteButton id={deposit.id} />}
      </div>
      {open && (
        <div className="paper bg-surface rounded-2xl p-4 mb-3 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.35)]">
          {deposit && <DepositForm funds={funds} today={today} initial={deposit} onDone={close} />}
          {fund && <FundPlanForm fund={fund} onDone={close} />}
        </div>
      )}
    </div>
  );
}
