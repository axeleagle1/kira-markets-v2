"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  TrendingUp,
  Landmark,
  Bitcoin,
  Trophy,
  BarChart3,
  Cpu,
  Film,
  Zap,
  LayoutGrid,
  User,
  Trophy as LeaderboardIcon,
  Gift,
  Users,
  Settings,
} from "lucide-react";

const MARKET_SECTIONS = [
  { href: "/markets", label: "All Markets", icon: LayoutGrid },
  { href: "/markets?cat=Trending", label: "Trending", icon: TrendingUp },
  { href: "/markets?cat=Politics", label: "Politics", icon: Landmark },
  { href: "/markets?cat=Crypto", label: "Crypto", icon: Bitcoin },
  { href: "/markets?cat=Sports", label: "Sports", icon: Trophy },
  { href: "/markets?cat=Economics", label: "Economy", icon: BarChart3 },
  { href: "/markets?cat=Technology", label: "Tech", icon: Cpu },
  { href: "/markets?cat=Entertainment", label: "Entertainment", icon: Film },
];

const ACCOUNT_SECTIONS = [
  { href: "/portfolio", label: "Portfolio", icon: User },
  { href: "/leaderboard", label: "Leaderboard", icon: LeaderboardIcon },
  { href: "/rewards", label: "Rewards", icon: Gift },
  { href: "/referrals", label: "Referrals", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden lg:flex flex-col w-[180px] shrink-0 overflow-y-auto"
      style={{
        borderRight: "1px solid var(--border)",
        background: "var(--bg-raised)",
      }}
    >
      <div className="flex-1 py-3">
        {/* Markets section */}
        <div className="mb-3">
          <div
            className="px-3 mb-1 text-[9px] font-bold uppercase tracking-widest"
            style={{ color: "var(--fg-dim)" }}
          >
            Markets
          </div>
          {MARKET_SECTIONS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href.includes("?") && pathname === "/markets");
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-3 py-1.5 text-xs transition-colors"
                style={{
                  color: active ? "var(--fg)" : "var(--fg-muted)",
                  background: active ? "var(--bg-surface)" : "transparent",
                  borderLeft: active ? "2px solid var(--yellow)" : "2px solid transparent",
                }}
              >
                <Icon size={14} strokeWidth={active ? 2.2 : 1.6} />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Account section */}
        <div>
          <div
            className="px-3 mb-1 text-[9px] font-bold uppercase tracking-widest"
            style={{ color: "var(--fg-dim)" }}
          >
            Account
          </div>
          {ACCOUNT_SECTIONS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-3 py-1.5 text-xs transition-colors"
                style={{
                  color: active ? "var(--fg)" : "var(--fg-muted)",
                  background: active ? "var(--bg-surface)" : "transparent",
                  borderLeft: active ? "2px solid var(--yellow)" : "2px solid transparent",
                }}
              >
                <Icon size={14} strokeWidth={active ? 2.2 : 1.6} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom */}
      <div
        className="px-3 py-2.5"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <Link
          href="/settings"
          className="flex items-center gap-2 text-xs transition-colors"
          style={{ color: "var(--fg-dim)" }}
        >
          <Settings size={14} />
          Settings
        </Link>
      </div>
    </aside>
  );
}
