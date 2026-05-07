import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/layout/providers";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Kira Markets — Prediction Markets",
  description: "Trade on real-world events with mock credits. Built for the Philippines.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 pb-16 md:pb-0">{children}</main>
            <MobileNav />
          </div>
        </Providers>
      </body>
    </html>
  );
}
