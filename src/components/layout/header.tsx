"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/contexts/auth-modal-context";
import { useDeposit } from "@/hooks/useDeposit";
import { useToast } from "@/contexts/toast-context";
import {
  ChevronDown,
  Wallet,
  Plus,
  Minus,
  Bell,
  TrendingUp,
  Trophy,
  Gift,
  Users,
  Settings,
  LogOut,
  Search,
  User,
} from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { data: portfolio } = usePortfolio();
  const { openSignIn, openSignUp } = useAuthModal();
  const depositMutation = useDeposit();
  const { addToast } = useToast();
  const [walletOpen, setWalletOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const walletRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const balance = portfolio?.balance ?? 0;

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (walletRef.current && !walletRef.current.contains(e.target as Node)) setWalletOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleDeposit = () => {
    depositMutation.mutate(undefined, {
      onSuccess: (data) => {
        addToast(`₱${data.deposited.toLocaleString()} deposited successfully`, "success");
        setWalletOpen(false);
      },
      onError: (error) => addToast(error.message, "error"),
    });
  };

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: "rgba(2, 6, 23, 0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="max-w-[1600px] mx-auto px-4 h-12 flex items-center gap-3">
        {/* Logo */}
        <Link href="/markets" className="flex items-center gap-2 shrink-0">
          <div
            className="w-6 h-6 rounded flex items-center justify-center"
            style={{ background: "var(--yellow)" }}
          >
            <span className="text-xs font-black" style={{ color: "var(--bg)" }}>K</span>
          </div>
          <span className="text-sm font-bold tracking-tight hide-mobile" style={{ color: "var(--fg)" }}>
            Kira
          </span>
        </Link>

        {/* Search Bar — wide, compact */}
        <div className="flex-1 max-w-md mx-2 hide-mobile">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2"
              style={{ color: "var(--fg-dim)" }}
            />
            <input
              type="text"
              placeholder="Search markets..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded outline-none transition-colors"
              style={{
                background: "var(--bg-surface)",
                color: "var(--fg)",
                border: "1px solid var(--border)",
              }}
            />
          </div>
        </div>

        <div className="flex-1" />

        {/* Right section */}
        <div className="flex items-center gap-1.5">
          {loading ? (
            <div className="w-28 h-7 skeleton rounded" />
          ) : user ? (
            <>
              {/* Peso Balance */}
              <div ref={walletRef} className="relative">
                <button
                  className="flex items-center gap-1.5 h-7 pl-2 pr-1.5 rounded transition-colors"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                  }}
                  onClick={() => { setWalletOpen(!walletOpen); setUserMenuOpen(false); setNotifOpen(false); }}
                >
                  <span className="text-[10px] font-medium" style={{ color: "var(--fg-dim)" }}>BAL</span>
                  <span className="text-xs font-bold tabular-nums" style={{ color: "var(--yellow)" }}>
                    ₱{balance.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <ChevronDown size={10} style={{ color: "var(--fg-dim)" }} />
                </button>

                {walletOpen && (
                  <div
                    className="absolute right-0 top-full mt-1 w-48 rounded overflow-hidden"
                    style={{
                      background: "var(--bg-raised)",
                      border: "1px solid var(--border-light)",
                      boxShadow: "var(--shadow-lg)",
                      zIndex: 100,
                    }}
                  >
                    <div className="px-3 py-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
                      <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--fg-dim)" }}>
                        Available Balance
                      </div>
                      <div className="text-lg font-bold tabular-nums" style={{ color: "var(--fg)" }}>
                        ₱{balance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="p-1.5">
                      <button
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded text-xs font-medium transition-colors"
                        style={{ color: "var(--fg)" }}
                        onClick={handleDeposit}
                        disabled={depositMutation.isPending}
                      >
                        <Plus size={14} style={{ color: "var(--yellow)" }} />
                        {depositMutation.isPending ? "Processing..." : "Deposit ₱1,000"}
                      </button>
                      <button
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded text-xs font-medium transition-colors"
                        style={{ color: "var(--fg-muted)" }}
                      >
                        <Minus size={14} />
                        Withdraw Funds
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Deposit Button */}
              <button
                className="h-7 px-2.5 text-[11px] font-semibold rounded transition-all hide-mobile"
                style={{
                  background: "var(--yellow)",
                  color: "var(--bg)",
                }}
                onClick={handleDeposit}
                disabled={depositMutation.isPending}
              >
                {depositMutation.isPending ? "..." : "Deposit"}
              </button>

              {/* Notification Bell */}
              <div ref={notifRef} className="relative">
                <button
                  className="p-1.5 rounded transition-colors"
                  style={{ color: "var(--fg-dim)" }}
                  onClick={() => { setNotifOpen(!notifOpen); setWalletOpen(false); setUserMenuOpen(false); }}
                >
                  <Bell size={16} />
                </button>
                {notifOpen && (
                  <div
                    className="absolute right-0 top-full mt-1 w-72 rounded overflow-hidden"
                    style={{
                      background: "var(--bg-raised)",
                      border: "1px solid var(--border-light)",
                      boxShadow: "var(--shadow-lg)",
                      zIndex: 100,
                    }}
                  >
                    <div className="px-3 py-2" style={{ borderBottom: "1px solid var(--border)" }}>
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--fg-dim)" }}>
                        Notifications
                      </span>
                    </div>
                    <div className="py-8 text-center">
                      <Bell size={20} className="mx-auto mb-2" style={{ color: "var(--fg-dim)" }} />
                      <p className="text-xs" style={{ color: "var(--fg-dim)" }}>No notifications yet</p>
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div ref={userMenuRef} className="relative">
                <button
                  className="w-7 h-7 rounded flex items-center justify-center text-[11px] font-bold transition-colors"
                  style={{
                    background: "var(--bg-surface)",
                    color: "var(--fg-muted)",
                    border: "1px solid var(--border)",
                  }}
                  onClick={() => { setUserMenuOpen(!userMenuOpen); setWalletOpen(false); setNotifOpen(false); }}
                >
                  {user.email?.charAt(0).toUpperCase() || "U"}
                </button>

                {userMenuOpen && (
                  <div
                    className="absolute right-0 top-full mt-1 w-44 rounded overflow-hidden"
                    style={{
                      background: "var(--bg-raised)",
                      border: "1px solid var(--border-light)",
                      boxShadow: "var(--shadow-lg)",
                      zIndex: 100,
                    }}
                  >
                    <div className="px-3 py-2" style={{ borderBottom: "1px solid var(--border)" }}>
                      <p className="text-xs font-medium truncate" style={{ color: "var(--fg)" }}>{user.email}</p>
                    </div>
                    <div className="p-1">
                      {[
                        { href: "/portfolio", label: "Portfolio", icon: TrendingUp },
                        { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
                        { href: "/rewards", label: "Rewards", icon: Gift },
                        { href: "/referrals", label: "Referrals", icon: Users },
                      ].map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded text-xs transition-colors"
                            style={{ color: "var(--fg-muted)" }}
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Icon size={14} />
                            {item.label}
                          </Link>
                        );
                      })}
                      <div className="my-1" style={{ borderTop: "1px solid var(--border)" }} />
                      <button
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs transition-colors"
                        style={{ color: "var(--fg-dim)" }}
                      >
                        <Settings size={14} />
                        Settings
                      </button>
                      <button
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs transition-colors"
                        style={{ color: "var(--fg-dim)" }}
                        onClick={() => {
                          import("@/lib/supabase/client").then(({ createClient }) => {
                            createClient().auth.signOut().then(() => window.location.href = "/markets");
                          });
                        }}
                      >
                        <LogOut size={14} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button
                className="px-3 py-1.5 text-xs font-medium rounded transition-colors"
                style={{ color: "var(--fg-muted)" }}
                onClick={openSignIn}
              >
                Sign In
              </button>
              <button
                className="px-3 py-1.5 text-xs font-semibold rounded transition-all"
                style={{ background: "var(--yellow)", color: "var(--bg)" }}
                onClick={openSignUp}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
