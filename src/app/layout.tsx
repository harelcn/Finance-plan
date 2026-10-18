import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "תכנון פיננסי",
  description: "תחזית יתרה, יעדים חודשיים, הוצאות מתוכננות והוראות קבע",
  // All icons are generated from public/idon2.png (the app's one icon).
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: { url: "/apple-icon.png", sizes: "180x180" },
  },
  // "Add to Home Screen" on iPhone opens it full-screen like an app, green under the status bar.
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "תכנון פיננסי" },
};

// viewport-fit=cover: draw edge to edge (under the notch / home indicator); safe-area insets pad the content.
export const viewport: Viewport = {
  themeColor: "#62b04f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-page text-ink antialiased" suppressHydrationWarning>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
