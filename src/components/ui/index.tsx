"use client";

import { forwardRef, type InputHTMLAttributes, type ButtonHTMLAttributes } from "react";

/* ── Button ─────────────────────────────────────────── */

type ButtonVariant = "default" | "green" | "red" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  default: {
    background: "var(--bg-surface)",
    color: "var(--fg)",
    border: "1px solid var(--border)",
  },
  green: {
    background: "var(--green)",
    color: "var(--bg)",
    border: "1px solid var(--green)",
  },
  red: {
    background: "var(--red)",
    color: "var(--fg)",
    border: "1px solid var(--red)",
  },
  ghost: {
    background: "transparent",
    color: "var(--fg-muted)",
    border: "1px solid transparent",
  },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", style, ...props }, ref) => (
    <button
      ref={ref}
      className="px-3 py-1.5 text-xs font-medium rounded transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ ...variantStyles[variant], ...style }}
      {...props}
    />
  )
);
Button.displayName = "Button";

/* ── Input ──────────────────────────────────────────── */

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ style, ...props }, ref) => (
    <input
      ref={ref}
      className="px-3 py-2 text-sm rounded outline-none transition-colors placeholder:text-[var(--fg-dim)]"
      style={{
        background: "var(--bg)",
        color: "var(--fg)",
        border: "1px solid var(--border)",
        ...style,
      }}
      {...props}
    />
  )
);
Input.displayName = "Input";

/* ── Badge ──────────────────────────────────────────── */

interface BadgeProps {
  children: React.ReactNode;
  color?: "green" | "red" | "blue" | "amber" | "default";
  style?: React.CSSProperties;
}

const badgeColors: Record<string, React.CSSProperties> = {
  green: { background: "var(--green-dim)", color: "var(--green)" },
  red: { background: "var(--red-dim)", color: "var(--red)" },
  blue: { background: "var(--blue-dim)", color: "var(--blue)" },
  amber: { background: "var(--amber-dim)", color: "var(--amber)" },
  default: { background: "var(--bg-surface)", color: "var(--fg-muted)" },
};

export function Badge({ children, color = "default", style }: BadgeProps) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded"
      style={{ ...badgeColors[color], ...style }}
    >
      {children}
    </span>
  );
}
