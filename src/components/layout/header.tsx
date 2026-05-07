"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/contexts/auth-modal-context";
import { useDeposit } from "@/hooks/useDeposit";
import { useToast } from "@/contexts/toast-context";
import { useTheme } from "@/contexts/theme-context";
import {
  Sun,
  Moon,
  ChevronDown,
  Wallet,
  Plus,
  Search,
  TrendingUp,
  User,
} from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { data: portfolio } = usePortfolio();
  const { openSignIn, openSignUp } = useAuthModal();
  const depositMutation = useDeposit();
  const { addToast } = useToast();
  const { theme, toggle: toggleTheme } = useTheme();
  const [walletOpen, setWalletOpen] = useState(false);
  const walletRef = useRef<HTMLDivElement>(null);

  const balance = portfolio?.balance ?? 0;

  // Close wallet dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (walletRef.current && !walletRef.current.contains(e.target as Node)) {
        setWalletOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleDeposit = () => {
    depositMutation.mutate(undefined, {
      onSuccess: (data) => {
        addToast(
          `₱${data.deposited.toLocaleString()} deposited! Balance: ₱${data.newBalance.toLocaleString()}`,
          "success"
        );
        setWalletOpen(false);
      },
      onError: (error) => {
        addToast(error.message, "error");
      },
    });
  };

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: "color-mix(in srgb, var(--bg) 80%, transparent)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 h-13 flex items-center gap-3">
        {/* Logo */}
        <Link href="/markets" className="flex items-center gap-2 shrink-0">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ background: "var(--yellow)" }}
          >
            <span className="text-sm font-black" style={{ color: "var(--fg)" }}>
              K
            </span>
          </div>
          <span className="text-base font-bold hidden sm:block" style={{ color: "var(--fg)" }}>
            Kira
          </span>
        </Link>

        {/* Navigation — desktop */}
        <nav className="hidden md:flex items-center gap-0.5 ml-2">
          {[
            { href: "/markets", label: "Markets", icon: TrendingUp },
            { href: "/portfolio", label: "Portfolio", icon: User },
          ].map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[13px] font-medium rounded-lg transition-colors"
                style={{
                  color: active ? "var(--fg)" : "var(--fg-muted)",
                  background: active ? "var(--bg-surface)" : "transparent",
                }}
              >
                <Icon size={14} strokeWidth={active ? 2.5 : 2} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg transition-colors"
            style={{ color: "var(--fg-muted)" }}
            title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          >
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {loading ? (
            <div className="w-32 h-8 skeleton rounded-lg" />
          ) : user ? (
            <>
              {/* Wallet Balance — premium */}
              <div ref={walletRef} className="relative">
                <button
                  className="flex items-center gap-2 h-8 pl-2.5 pr-2 rounded-lg transition-all"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                  }}
                  onClick={() => setWalletOpen(!walletOpen)}
                >
                  <Wallet size={14} style={{ color: "var(--fg-muted)" }} />
                  <span
                    className="text-[13px] font-semibold tabular-nums"
                    style={{ color: "var(--fg)" }}
                  >
                    ₱{balance.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <ChevronDown
                    size={12}
                    style={{
                      color: "var(--fg-dim)",
                      transform: walletOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.15s",
                    }}
                  />
                </button>

                {/* Wallet Dropdown */}
                {walletOpen && (
                  <div
                    className="absolute right-0 top-full mt-1.5 w-56 rounded-xl overflow-hidden"
                    style={{
                      background: "var(--bg-raised)",
                      border: "1px solid var(--border)",
                      boxShadow: "var(--shadow-lg)",
                      zIndex: 100,
                    }}
                  >
                    {/* Balance display */}
                    <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-light)" }}>
                      <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--fg-dim)" }}>
                        Available Balance
                      </div>
                      <div className="text-xl font-bold tabular-nums" style={{ color: "var(--fg)" }}>
                        ₱{balance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-2">
                      <button
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors"
                        style={{
                          color: "var(--fg)",
                          background: "var(--yellow-subtle)",
                        }}
                        onClick={handleDeposit}
                        disabled={depositMutation.isPending}
                      >
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center"
                          style={{ background: "var(--yellow)" }}
                        >
                          {depositMutation.isPending ? (
                            <div className="w-3 h-3 border-2 border-[var(--fg)] border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Plus size={14} strokeWidth={3} style={{ color: "var(--fg)" }} />
                          )}
                        </div>
                        {depositMutation.isPending ? "Depositing..." : "Deposit ₱1,000"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar */}
              <Link
                href="/portfolio"
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{
                  background: "var(--green-dim)",
                  color: "var(--green)",
                }}
              >
                {user.email?.charAt(0).toUpperCase() || "U"}
              </Link>
            </>
          ) : (
            <>
              <button
                className="px-3 py-1.5 text-[13px] font-medium rounded-lg transition-colors"
                style={{
                  color: "var(--fg-muted)",
                }}
                onClick={openSignIn}
              >
                Sign In
              </button>
              <button
                className="px-3.5 py-1.5 text-[13px] font-semibold rounded-lg transition-all"
                style={{
                  background: "var(--yellow)",
                  color: "var(--fg)",
                }}
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
