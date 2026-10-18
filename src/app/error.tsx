"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="bg-zinc-900/60 border border-white/5 rounded-2xl p-8 text-center space-y-4">
      <p className="text-lg font-light">לא הצלחתי לטעון נתונים מ-Notion</p>
      <p className="text-xs text-zinc-500">כנראה תקלת רשת רגעית. נסה שוב.</p>
      <button onClick={reset} className="bg-white text-black rounded-xl px-6 py-2.5 text-sm font-medium">
        טען מחדש
      </button>
    </section>
  );
}
