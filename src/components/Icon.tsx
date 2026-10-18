const PATHS = {
  home: "M3 10.5 12 3l9 7.5M5 9v11h5v-6h4v6h5V9",
  chart: "M3 20h18M5 16l4-5 4 3 6-8",
  target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-4a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-4a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  repeat: "M17 2l3 3-3 3M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3M20 13v2a4 4 0 0 1-4 4H4",
  sliders: "M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4",
  plus: "M12 5v14M5 12h14",
  close: "M6 6l12 12M18 6 6 18",
  menu: "M4 7h16M4 12h16M4 17h16",
  wallet: "M3 7h15a3 3 0 0 1 3 3v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm0 0 2-3h11M16 14h1",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v5l3 2",
  chevron: "M15 6l-6 6 6 6",
  edit: "M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4",
  receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2V3ZM9 8h6M9 12h6M9 16h3",
  coins: "M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "w-5 h-5" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}
