import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return `${(price * 100).toFixed(1)}%`;
}

export function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`;
  }
  return `$${amount.toFixed(2)}`;
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function formatShares(shares: number): string {
  return shares.toFixed(2);
}

export function formatPnl(pnl: number): string {
  const sign = pnl >= 0 ? "+" : "";
  return `${sign}$${Math.abs(pnl).toFixed(2)}`;
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(1)}%`;
}

export function timeAgo(date: Date | string): string {
  const now = new Date();
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return d.toLocaleDateString();
}

export function getRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = d.getTime() - now.getTime();

  if (diff < 0) return "Ended";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    POLITICS: "text-blue-400 bg-blue-400/10",
    CRYPTO: "text-orange-400 bg-orange-400/10",
    SPORTS: "text-green-400 bg-green-400/10",
    ENTERTAINMENT: "text-purple-400 bg-purple-400/10",
    SCIENCE: "text-cyan-400 bg-cyan-400/10",
    TECHNOLOGY: "text-indigo-400 bg-indigo-400/10",
    ECONOMICS: "text-yellow-400 bg-yellow-400/10",
    WEATHER: "text-sky-400 bg-sky-400/10",
    OTHER: "text-zinc-400 bg-zinc-400/10",
  };
  return colors[category] || colors.OTHER;
}

export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    POLITICS: "Landmark",
    CRYPTO: "Bitcoin",
    SPORTS: "Trophy",
    ENTERTAINMENT: "Film",
    SCIENCE: "FlaskConical",
    TECHNOLOGY: "Cpu",
    ECONOMICS: "TrendingUp",
    WEATHER: "CloudSun",
    OTHER: "HelpCircle",
  };
  return icons[category] || icons.OTHER;
}
