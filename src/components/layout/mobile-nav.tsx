"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, User, Trophy, Gift } from "lucide-react";

const NAV_ITEMS = [
  { href: "/markets", label: "Markets", icon: LayoutGrid },
  { href: "/portfolio", label: "Portfolio", icon: User },
  { href: "/leaderboard", label: "Ranks", icon: Trophy },
  { href: "/rewards", label: "Rewards", icon: Gift },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{
        background: "rgba(15, 23, 42, 0.95)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderTop: "1px solid var(--border)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex items-center justify-around h-12">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-0 flex-1 py-1 transition-colors"
              style={{
                color: isActive ? "var(--yellow)" : "var(--fg-dim)",
              }}
            >
              <Icon size={18} strokeWidth={isActive ? 2.2 : 1.6} />
              <span className="text-[9px] font-semibold mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
