"use client";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { addPlanned, addStanding, addTarget, removeRow, type ActionState } from "@/app/actions";
import type { PlannedExpense, StandingOrder, Target } from "@/lib/types";
import { Icon } from "./Icon";

// 16px text: iOS zooms into any field smaller than that.
export const input = "field bg-surface border border-line rounded-xl px-3 h-12 text-base w-full min-w-0 focus:outline-none focus:border-brand";
export const label = "text-xs text-muted space-y-1.5 block";

export function Submit({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-brand text-onbrand rounded-xl px-4 py-3 text-sm font-medium disabled:opacity-50 active:scale-[0.99] transition"
    >
      {pending ? "שומר…" : children}
    </button>
  );
}

/** Resets a create form after a successful save, or closes an edit form via `onDone`. */
export function useAfterSuccess(state: ActionState, onDone?: () => void) {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!state.ok) return;
    if (onDone) onDone();
    else ref.current?.reset();
  }, [state.ok]); // eslint-disable-line react-hooks/exhaustive-deps
  return ref;
}

export function FormError({ state }: { state: ActionState }) {
  return state.error ? <p className="text-xs text-danger">⚠ {state.error}</p> : null;
}

type EditProps<T> = { initial?: T; onDone?: () => void };

export function TargetForm({ today, defaultFrom, initial, onDone }: { today: string; defaultFrom?: string } & EditProps<Target>) {
  const [state, action, pending] = useActionState(addTarget, {});
  const ref = useAfterSuccess(state, onDone);
  return (
    <form ref={ref} action={action} className="space-y-4">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 [&>*]:min-w-0">
        <label className={label}>
          <span>סוג</span>
          <select name="kind" defaultValue={initial?.kind ?? "income"} className={input}>
            <option value="income">הכנסה</option>
            <option value="expense">הוצאה</option>
          </select>
        </label>
        <label className={label}>
          <span>סכום חודשי</span>
          <input name="amount" inputMode="numeric" defaultValue={initial?.amount} className={input} required />
        </label>
        <label className={label}>
          <span>החל מ־</span>
          <input name="from" type="date" defaultValue={initial?.from ?? defaultFrom ?? `${today.slice(0, 7)}-01`} className={input} required />
        </label>
      </div>
      <FormError state={state} />
      <Submit pending={pending}>{initial ? "שמור שינויים" : "עדכן יעד"}</Submit>
    </form>
  );
}

export function PlannedForm({ today, initial, onDone }: { today: string } & EditProps<PlannedExpense>) {
  const [state, action, pending] = useActionState(addPlanned, {});
  const ref = useAfterSuccess(state, onDone);
  const [mode, setMode] = useState<"once" | "installments">((initial?.installments ?? 1) > 1 ? "installments" : "once");
  return (
    <form ref={ref} action={action} className="space-y-4">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 [&>*]:min-w-0">
        <label className={label}>
          <span>שם</span>
          <input name="name" defaultValue={initial?.name} className={input} placeholder="חתונה" required />
        </label>
        <label className={label}>
          <span>סכום כולל</span>
          <input name="amount" inputMode="numeric" defaultValue={initial?.amount} className={input} required />
        </label>
        <label className={label}>
          <span>{mode === "once" ? "תאריך" : "תשלום ראשון"}</span>
          <input name="date" type="date" defaultValue={initial?.date ?? today} className={input} required />
        </label>
        <label className={label}>
          <span>אופן תשלום</span>
          <select
            name="mode"
            value={mode}
            onChange={(e) => setMode(e.target.value as "once" | "installments")}
            className={input}
          >
            <option value="once">חד פעמי (בום)</option>
            <option value="installments">תשלומים</option>
          </select>
        </label>
        {mode === "installments" && (
          <label className={label}>
            <span>מספר תשלומים</span>
            <input
              name="installments"
              type="number"
              min={2}
              max={120}
              defaultValue={(initial?.installments ?? 1) > 1 ? initial!.installments : 3}
              className={input}
              required
            />
          </label>
        )}
      </div>
      <FormError state={state} />
      <Submit pending={pending}>{initial ? "שמור שינויים" : "הוסף הוצאה"}</Submit>
    </form>
  );
}

export function StandingForm({ today, initial, onDone }: { today: string } & EditProps<StandingOrder>) {
  const [state, action, pending] = useActionState(addStanding, {});
  const ref = useAfterSuccess(state, onDone);
  return (
    <form ref={ref} action={action} className="space-y-4">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 [&>*]:min-w-0">
        <label className={label}>
          <span>שם</span>
          <input name="name" defaultValue={initial?.name} className={input} placeholder="ביטוח רכב" required />
        </label>
        <label className={label}>
          <span>סכום חודשי</span>
          <input name="amount" inputMode="numeric" defaultValue={initial?.amount} className={input} required />
        </label>
        <label className={label}>
          <span>חיוב ראשון (קובע את יום החיוב)</span>
          <input name="start" type="date" defaultValue={initial?.start ?? today} className={input} required />
        </label>
        <label className={label}>
          <span>סיום (לא חובה)</span>
          <input name="end" type="date" defaultValue={initial?.end ?? undefined} className={input} />
        </label>
      </div>
      <FormError state={state} />
      <Submit pending={pending}>{initial ? "שמור שינויים" : "הוסף הוראת קבע"}</Submit>
    </form>
  );
}

export function DeleteButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);
  if (!confirm)
    return (
      <button onClick={() => setConfirm(true)} className="w-8 h-8 grid place-items-center rounded-full text-faint hover:text-ink hover:bg-ink/10" aria-label="מחק">
        <Icon name="close" className="w-4 h-4" />
      </button>
    );
  return (
    <span className="flex gap-2 text-xs">
      <button
        disabled={pending}
        onClick={() => start(async () => void (await removeRow(id)))}
        className="text-ink underline"
      >
        {pending ? "…" : "מחק"}
      </button>
      <button onClick={() => setConfirm(false)} className="text-muted">
        ביטול
      </button>
    </span>
  );
}

type EditableItem =
  | { kind: "target"; item: Target }
  | { kind: "planned"; item: PlannedExpense }
  | { kind: "standing"; item: StandingOrder };

/** A list row with a pencil that opens the item's form, prefilled, right under it. */
export function EditableRow({ row, today, ...edit }: { row: React.ReactNode; today: string } & EditableItem) {
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
        <DeleteButton id={edit.item.id} />
      </div>
      {open && (
        <div className="paper bg-surface rounded-2xl p-4 mb-3 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.35)]">
          {edit.kind === "target" && <TargetForm today={today} initial={edit.item} onDone={close} />}
          {edit.kind === "planned" && <PlannedForm today={today} initial={edit.item} onDone={close} />}
          {edit.kind === "standing" && <StandingForm today={today} initial={edit.item} onDone={close} />}
        </div>
      )}
    </div>
  );
}

/** Collapsed "+ הוספה" button that expands into its form. */
export function AddSheet({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return open ? (
    <div className="paper bg-surface rounded-3xl p-5 space-y-4 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.35)]">
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-medium text-ink">{label}</h2>
        <button onClick={() => setOpen(false)} className="text-xs text-muted hover:text-ink">סגור</button>
      </div>
      {children}
    </div>
  ) : (
    <button
      onClick={() => setOpen(true)}
      className="w-full flex items-center justify-center gap-2 rounded-full bg-brand text-onbrand py-3.5 text-sm font-medium shadow-[0_6px_16px_-8px_rgba(0,0,0,0.35)] active:scale-[0.99] transition"
    >
      <span className="text-lg leading-none">+</span> {label}
    </button>
  );
}
