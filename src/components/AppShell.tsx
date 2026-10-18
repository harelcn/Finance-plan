"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon, type IconName } from "./Icon";

export const NAV: Array<{ href: string; label: string; icon: IconName }> = [
  { href: "/", label: "מצב החשבון שלי", icon: "home" },
  { href: "/forecast", label: "תחזית", icon: "chart" },
  { href: "/tracking", label: "יעד מול ביצוע", icon: "target" },
  { href: "/planned", label: "הוצאות מתוכננות", icon: "calendar" },
  { href: "/standing", label: "הוראות קבע", icon: "repeat" },
  { href: "/targets", label: "יעדים חודשיים", icon: "sliders" },
];

const TABS: Array<{ href: string; label: string; icon: IconName }> = [
  { href: "/", label: "בית", icon: "home" },
  { href: "/forecast", label: "תחזית", icon: "chart" },
  { href: "/tracking", label: "מעקב", icon: "target" },
  { href: "/targets", label: "יעדים", icon: "sliders" },
];

const ADD: Array<{ href: string; label: string; icon: IconName }> = [
  { href: "/planned", label: "הוצאה מתוכננת", icon: "calendar" },
  { href: "/standing", label: "הוראת קבע", icon: "repeat" },
  { href: "/targets", label: "עדכון יעד", icon: "sliders" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [add, setAdd] = useState(false);
  const path = usePathname();
  const current = NAV.find((n) => n.href === path) ?? NAV[0];

  useEffect(() => {
    setOpen(false);
    setAdd(false);
  }, [path]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && (setOpen(false), setAdd(false));
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = open ? "hidden" : "";
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* green top bar: menu · title · home */}
      <header className="sticky top-0 z-30 bg-page/95 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
        <div className="max-w-xl mx-auto h-14 px-3 grid grid-cols-[40px_1fr_40px] items-center">
          <button onClick={() => setOpen(true)} aria-label="תפריט" className="w-10 h-10 grid place-items-center rounded-full hover:bg-ink/10">
            <Icon name="menu" className="w-6 h-6" />
          </button>
          <span className="text-center text-base font-medium">{current.label}</span>
          <Link href="/" aria-label="בית" className="w-10 h-10 grid place-items-center rounded-full hover:bg-ink/10">
            <Icon name="home" className="w-6 h-6" />
          </Link>
        </div>
      </header>

      {/* drawer (white) */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setOpen(false)}
      />
      <nav
        className={`paper fixed top-0 right-0 z-50 h-full pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] w-[300px] max-w-[85vw] bg-surface flex flex-col transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
        aria-hidden={!open}
      >
        <div className="h-14 px-4 flex items-center justify-between border-b border-line">
          <span className="text-base font-medium">תכנון פיננסי</span>
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
                  className={`flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors ${active ? "bg-brand text-onbrand" : "hover:bg-subtle text-ink"}`}
                >
                  <span className={`w-9 h-9 grid place-items-center rounded-full ${active ? "bg-onbrand/20" : "bg-subtle text-brand"}`}>
                    <Icon name={n.icon} />
                  </span>
                  <span className="text-sm font-medium">{n.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <main className="max-w-xl mx-auto px-4 pt-3 pb-[calc(8rem+env(safe-area-inset-bottom))] space-y-4">{children}</main>

      {/* "+" quick-add menu */}
      {add && <div className="fixed inset-0 z-30" onClick={() => setAdd(false)} />}
      <div
        className={`paper fixed z-40 bottom-24 left-1/2 -translate-x-1/2 w-56 bg-surface rounded-2xl p-2 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.4)] transition-all duration-200 ${add ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}
      >
        {ADD.map((a) => (
          <Link key={a.label} href={a.href} tabIndex={add ? 0 : -1} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-subtle text-sm">
            <span className="w-8 h-8 grid place-items-center rounded-full bg-subtle text-brand">
              <Icon name={a.icon} className="w-4 h-4" />
            </span>
            {a.label}
          </Link>
        ))}
      </div>

      {/* white bottom bar: its top edge slopes down to the "+" button's equator, so the button sits half above the bar */}
      <nav
        className="paper fixed bottom-0 inset-x-0 z-30 pb-[env(safe-area-inset-bottom)]"
        style={{ filter: "drop-shadow(0 -3px 10px rgba(0,0,0,0.10))" }}
      >
        <div className="absolute inset-0 flex flex-col" aria-hidden>
          <div className="h-16 flex">
            <div className="flex-1 bg-surface" />
            <svg viewBox="0 0 120 64" className="w-[122px] -mx-px h-16 shrink-0 block relative" preserveAspectRatio="none" style={{ fill: "rgb(var(--surface))" }}>
              {/* edges start close to the button and keep sloping until they meet its sides at the middle
                  (button r=27 centred at x=60, y=10; contact at x≈31.5 / 88.5, no flat run, ~1.5px gap) */}
              <path d="M0,0 H18 C25,0 29,3 31.5,10 H88.5 C91,3 95,0 102,0 H120 V64 H0 Z" />
            </svg>
            <div className="flex-1 bg-surface" />
          </div>
          <div className="flex-1 bg-surface" />
        </div>

        <div className="relative max-w-xl mx-auto h-16 px-2 grid grid-cols-5 items-center">
          {[TABS[0], TABS[1]].map((t) => (
            <Tab key={t.href} {...t} active={path === t.href} />
          ))}
          <div className="relative h-full">
            <button
              onClick={() => setAdd((v) => !v)}
              aria-label="הוספה"
              className={`absolute left-1/2 -translate-x-1/2 -top-[17px] w-[54px] h-[54px] grid place-items-center rounded-full bg-fab text-white shadow-[0_10px_22px_-6px_rgba(90,86,230,0.65)] transition-transform active:scale-95 ${add ? "rotate-45" : ""}`}
            >
              <Icon name="plus" className="w-6 h-6" />
            </button>
          </div>
          {[TABS[2], TABS[3]].map((t) => (
            <Tab key={t.href} {...t} active={path === t.href} />
          ))}
        </div>
      </nav>
    </>
  );
}

function Tab({ href, label, icon, active }: { href: string; label: string; icon: IconName; active: boolean }) {
  return (
    <Link href={href} className={`flex flex-col items-center gap-1 text-[11px] ${active ? "text-brand font-medium" : "text-muted"}`}>
      <Icon name={icon} className="w-5 h-5" />
      {label}
    </Link>
  );
}
