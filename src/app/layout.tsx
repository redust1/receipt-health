import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "レシート健康チェック | Receipt Health",
  description: "レシートを撮影するだけで、食品成分を自動分析。あなたの健康生活をサポートします。",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Receipt Health",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#4CAF50",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full flex flex-col bg-[#F9FBF9] overscroll-none">
        {children}
      </body>
    </html>
  );
}
