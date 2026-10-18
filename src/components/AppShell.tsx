"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon, type IconName } from "./Icon";

export const NAV: Array<{ href: string; label: string; hint: string; icon: IconName }> = [
  { href: "/", label: "ראשי", hint: "יתרה ותמונת מצב", icon: "home" },
  { href: "/forecast", label: "תחזית", hint: "כמה יהיה לי בכל תאריך", icon: "chart" },
  { href: "/tracking", label: "יעד מול ביצוע", hint: "מעקב חודשי", icon: "target" },
  { href: "/planned", label: "הוצאות מתוכננות", hint: "חד פעמי או בתשלומים", icon: "calendar" },
  { href: "/standing", label: "הוראות קבע", hint: "חיובים חודשיים קבועים", icon: "repeat" },
  { href: "/targets", label: "יעדים חודשיים", hint: "הכנסה והוצאה ממוצעת", icon: "sliders" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const current = NAV.find((n) => n.href === path) ?? NAV[0];

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = open ? "hidden" : "";
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-xl mx-auto h-14 px-4 flex items-center gap-3">
          <button
            onClick={() => setOpen(true)}
            aria-label="תפריט"
            className="w-10 h-10 -mr-2 grid place-items-center rounded-full hover:bg-white/5 active:bg-white/10"
          >
            <Icon name="menu" className="w-6 h-6" />
          </button>
          <span className="text-[15px] font-medium">{current.label}</span>
          <span className="mr-auto text-[11px] tracking-[0.2em] text-zinc-500">FINANCE PLAN</span>
        </div>
      </header>

      {/* drawer */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setOpen(false)}
      />
      <nav
        className={`fixed top-0 right-0 z-50 h-full w-[300px] max-w-[85vw] bg-zinc-950 border-l border-white/5 flex flex-col transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
        aria-hidden={!open}
      >
        <div className="h-14 px-4 flex items-center justify-between border-b border-white/5">
          <span className="text-[15px] font-medium">תכנון פיננסי</span>
          <button onClick={() => setOpen(false)} aria-label="סגור" className="w-10 h-10 grid place-items-center rounded-full hover:bg-white/5">
            <Icon name="close" />
          </button>
        </div>
        <ul className="p-3 space-y-1 flex-1 overflow-y-auto">
          {NAV.map((n) => {
            const active = n.href === path;
            return (
              <li key={n.href}>
                <Link
                  href={n.href}
                  tabIndex={open ? 0 : -1}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 transition-colors ${active ? "bg-white text-black" : "hover:bg-white/5 text-zinc-200"}`}
                >
                  <span className={`w-9 h-9 grid place-items-center rounded-full ${active ? "bg-black/10" : "bg-white/5"}`}>
                    <Icon name={n.icon} />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-sm font-medium">{n.label}</span>
                    <span className={`text-[11px] ${active ? "text-black/60" : "text-zinc-500"}`}>{n.hint}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="p-4 text-[11px] text-zinc-600 border-t border-white/5">נתונים מ-Notion · מתעדכן בכל טעינה</p>
      </nav>

      <main className="max-w-xl mx-auto px-4 pt-5 pb-16 space-y-5">{children}</main>
    </>
  );
}
