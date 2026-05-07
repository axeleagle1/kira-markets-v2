import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/layout/providers";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Kira — Philippine Prediction Exchange",
  description: "Trade on real-world events with Philippine Peso. Institutional-grade prediction markets for the Philippines.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Header />
            <div className="flex flex-1 overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
                {children}
              </main>
            </div>
            <MobileNav />
          </div>
        </Providers>
      </body>
    </html>
  );
}
