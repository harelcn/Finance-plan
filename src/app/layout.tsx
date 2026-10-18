import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "תכנון פיננסי",
  description: "תחזית יתרה, יעדים חודשיים, הוצאות מתוכננות והוראות קבע",
  icons: { icon: "/icon.png", apple: "/icon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@700&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className="min-h-screen bg-black text-white antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
