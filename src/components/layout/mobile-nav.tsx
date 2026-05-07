"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrendingUp, User } from "lucide-react";

const NAV_ITEMS = [
  { href: "/markets", label: "Markets", icon: TrendingUp },
  { href: "/portfolio", label: "Portfolio", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{
        background: "color-mix(in srgb, var(--bg) 85%, transparent)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderTop: "1px solid var(--border)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex items-center justify-around h-14">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors"
              style={{
                color: isActive ? "var(--fg)" : "var(--fg-dim)",
              }}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 1.8}
                style={isActive ? { color: "var(--yellow)" } : undefined}
              />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
