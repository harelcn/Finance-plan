"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="paper bg-surface rounded-3xl p-8 text-center space-y-4">
      <p className="text-lg font-light">לא הצלחתי לטעון נתונים מ-Notion</p>
      <button onClick={reset} className="bg-brand text-onbrand rounded-xl px-6 py-2.5 text-sm font-medium">
        טען מחדש
      </button>
    </section>
  );
}
