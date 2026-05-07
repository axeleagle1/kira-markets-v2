"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/contexts/auth-modal-context";
import { useDeposit } from "@/hooks/useDeposit";
import { useToast } from "@/contexts/toast-context";

export function Header() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { data: portfolio } = usePortfolio();
  const { openSignIn, openSignUp } = useAuthModal();
  const depositMutation = useDeposit();
  const { addToast } = useToast();

  const balance = portfolio?.balance ?? 0;

  const handleDeposit = () => {
    depositMutation.mutate(undefined, {
      onSuccess: (data) => {
        addToast(`₱${data.deposited.toLocaleString()} deposited! Balance: ₱${data.newBalance.toLocaleString()}`, "success");
      },
      onError: (error) => {
        addToast(error.message, "error");
      },
    });
  };

  const navItems = [
    { href: "/markets", label: "Markets" },
    { href: "/portfolio", label: "Portfolio" },
  ];

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: "var(--bg)",
        borderBottom: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/markets" className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--yellow)" }}
          >
            <span className="text-lg font-bold" style={{ color: "var(--fg)" }}>
              K
            </span>
          </div>
          <span className="text-lg font-bold" style={{ color: "var(--fg)" }}>
            Kira
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
              style={{
                color: pathname === item.href ? "var(--fg)" : "var(--fg-muted)",
                background: pathname === item.href ? "var(--bg-surface)" : "transparent",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-24 h-8 skeleton rounded-full" />
          ) : user ? (
            <>
              {/* Balance Pill */}
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{ background: "var(--bg-surface)" }}
              >
                <span className="text-xs font-medium" style={{ color: "var(--fg-muted)" }}>
                  Balance
                </span>
                <span className="text-sm font-bold tabular-nums" style={{ color: "var(--fg)" }}>
                  ₱{balance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Deposit Button */}
              <button
                className="px-4 py-1.5 text-sm font-semibold rounded-full transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "var(--yellow)", color: "var(--fg)" }}
                onClick={handleDeposit}
                disabled={depositMutation.isPending}
              >
                {depositMutation.isPending ? (
                  <span className="flex items-center gap-1.5">
                    <div className="w-3 h-3 border-2 border-[var(--fg)] border-t-transparent rounded-full animate-spin" />
                    Depositing...
                  </span>
                ) : (
                  "Deposit"
                )}
              </button>

              {/* User Avatar */}
              <Link
                href="/portfolio"
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "var(--green-dim)" }}
              >
                <span className="text-xs font-bold" style={{ color: "var(--green)" }}>
                  {user.email?.charAt(0).toUpperCase() || "U"}
                </span>
              </Link>
            </>
          ) : (
            <>
              <button
                className="px-4 py-1.5 text-sm font-medium rounded-full transition-colors"
                style={{
                  color: "var(--fg-muted)",
                  border: "1px solid var(--border)",
                }}
                onClick={openSignIn}
              >
                Sign In
              </button>
              <button
                className="px-4 py-1.5 text-sm font-semibold rounded-full transition-colors"
                style={{ background: "var(--yellow)", color: "var(--fg)" }}
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
