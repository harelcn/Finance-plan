"use client";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { addPlanned, addStanding, addTarget, removeRow, type ActionState } from "@/app/actions";

const input = "bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm w-full min-w-0";
const label = "text-xs text-zinc-500 space-y-1 block";

function Submit({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-white text-black rounded-lg px-4 py-2 text-sm disabled:opacity-50"
    >
      {pending ? "שומר…" : children}
    </button>
  );
}

function useResetOnSuccess(state: ActionState) {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);
  return ref;
}

function FormError({ state }: { state: ActionState }) {
  return state.error ? <p className="text-xs text-zinc-300">⚠ {state.error}</p> : null;
}

export function TargetForm({ today }: { today: string }) {
  const [state, action, pending] = useActionState(addTarget, {});
  const ref = useResetOnSuccess(state);
  return (
    <form ref={ref} action={action} className="space-y-3 border-t border-zinc-800 pt-4">
      <p className="text-xs text-zinc-500">יעד חדש מחליף את הקודם מהחודש שבו הוא מתחיל</p>
      <div className="grid grid-cols-3 gap-2">
        <label className={label}>
          <span>סוג</span>
          <select name="kind" className={input}>
            <option value="income">הכנסה</option>
            <option value="expense">הוצאה</option>
          </select>
        </label>
        <label className={label}>
          <span>סכום חודשי</span>
          <input name="amount" inputMode="numeric" className={input} required />
        </label>
        <label className={label}>
          <span>החל מ־</span>
          <input name="from" type="date" defaultValue={`${today.slice(0, 7)}-01`} className={input} required />
        </label>
      </div>
      <FormError state={state} />
      <Submit pending={pending}>עדכן יעד</Submit>
    </form>
  );
}

export function PlannedForm({ today }: { today: string }) {
  const [state, action, pending] = useActionState(addPlanned, {});
  const ref = useResetOnSuccess(state);
  const [mode, setMode] = useState<"once" | "installments">("once");
  return (
    <form ref={ref} action={action} className="space-y-3 border-t border-zinc-800 pt-4">
      <div className="grid grid-cols-2 gap-2">
        <label className={label}>
          <span>שם</span>
          <input name="name" className={input} placeholder="חתונה" required />
        </label>
        <label className={label}>
          <span>סכום כולל</span>
          <input name="amount" inputMode="numeric" className={input} required />
        </label>
        <label className={label}>
          <span>{mode === "once" ? "תאריך" : "תשלום ראשון"}</span>
          <input name="date" type="date" defaultValue={today} className={input} required />
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
            <input name="installments" type="number" min={2} max={120} defaultValue={3} className={input} required />
          </label>
        )}
      </div>
      <FormError state={state} />
      <Submit pending={pending}>הוסף הוצאה</Submit>
    </form>
  );
}

export function StandingForm({ today }: { today: string }) {
  const [state, action, pending] = useActionState(addStanding, {});
  const ref = useResetOnSuccess(state);
  return (
    <form ref={ref} action={action} className="space-y-3 border-t border-zinc-800 pt-4">
      <div className="grid grid-cols-2 gap-2">
        <label className={label}>
          <span>שם</span>
          <input name="name" className={input} placeholder="ביטוח רכב" required />
        </label>
        <label className={label}>
          <span>סכום חודשי</span>
          <input name="amount" inputMode="numeric" className={input} required />
        </label>
        <label className={label}>
          <span>חיוב ראשון (קובע את יום החיוב)</span>
          <input name="start" type="date" defaultValue={today} className={input} required />
        </label>
        <label className={label}>
          <span>סיום (לא חובה)</span>
          <input name="end" type="date" className={input} />
        </label>
      </div>
      <FormError state={state} />
      <Submit pending={pending}>הוסף הוראת קבע</Submit>
    </form>
  );
}

export function DeleteButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);
  if (!confirm)
    return (
      <button onClick={() => setConfirm(true)} className="text-zinc-600 hover:text-zinc-300 text-xs px-1" aria-label="מחק">
        ✕
      </button>
    );
  return (
    <span className="flex gap-2 text-xs">
      <button
        disabled={pending}
        onClick={() => start(async () => void (await removeRow(id)))}
        className="text-white underline"
      >
        {pending ? "…" : "מחק"}
      </button>
      <button onClick={() => setConfirm(false)} className="text-zinc-500">
        ביטול
      </button>
    </span>
  );
}
