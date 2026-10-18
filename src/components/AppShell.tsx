"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon, type IconName } from "./Icon";

export const NAV: Array<{ href: string; label: string; icon: IconName }> = [
  { href: "/", label: "ראשי", icon: "home" },
  { href: "/forecast", label: "תחזית", icon: "chart" },
  { href: "/tracking", label: "יעד מול ביצוע", icon: "target" },
  { href: "/planned", label: "הוצאות מתוכננות", icon: "calendar" },
  { href: "/standing", label: "הוראות קבע", icon: "repeat" },
  { href: "/targets", label: "יעדים חודשיים", icon: "sliders" },
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
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-xl border-b border-line">
        <div className="max-w-xl mx-auto h-14 px-4 flex items-center gap-3">
          <button
            onClick={() => setOpen(true)}
            aria-label="תפריט"
            className="w-10 h-10 -mr-2 grid place-items-center rounded-full hover:bg-subtle active:bg-line"
          >
            <Icon name="menu" className="w-6 h-6" />
          </button>
          <span className="text-[15px] font-medium">{current.label}</span>
          <span className="mr-auto text-[11px] tracking-[0.2em] text-brand font-medium">FINANCE PLAN</span>
        </div>
      </header>

      {/* drawer */}
      <div
        className={`fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setOpen(false)}
      />
      <nav
        className={`fixed top-0 right-0 z-50 h-full w-[300px] max-w-[85vw] bg-surface border-l border-line flex flex-col transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
        aria-hidden={!open}
      >
        <div className="h-14 px-4 flex items-center justify-between border-b border-line">
          <span className="text-[15px] font-medium">תכנון פיננסי</span>
          <button onClick={() => setOpen(false)} aria-label="סגור" className="w-10 h-10 grid place-items-center rounded-full hover:bg-subtle">
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
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 transition-colors ${active ? "bg-brand text-onbrand" : "hover:bg-subtle text-ink"}`}
                >
                  <span className={`w-9 h-9 grid place-items-center rounded-full ${active ? "bg-onbrand/15" : "bg-subtle"}`}>
                    <Icon name={n.icon} />
                  </span>
                  <span className="text-sm font-medium">{n.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <main className="max-w-xl mx-auto px-4 pt-5 pb-16 space-y-5">{children}</main>
    </>
  );
}
