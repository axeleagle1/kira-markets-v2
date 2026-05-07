"use client";

import { useToast } from "@/contexts/toast-context";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const CONFIG: Record<string, { icon: React.ComponentType<{ size?: number }>; bg: string; fg: string; border: string }> = {
  success: { icon: CheckCircle2, bg: "var(--green-bg)", fg: "var(--green)", border: "var(--green-dim)" },
  error: { icon: AlertCircle, bg: "var(--red-bg)", fg: "var(--red)", border: "var(--red-dim)" },
  info: { icon: Info, bg: "var(--yellow-subtle)", fg: "#D97706", border: "var(--yellow-dim)" },
};

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 right-3 z-[200] flex flex-col gap-2 max-w-xs w-full pointer-events-none">
      {toasts.map((toast) => {
        const config = CONFIG[toast.type] || CONFIG.info;
        const Icon = config.icon;

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-lg px-3 py-2.5 flex items-start gap-2.5 ${
              toast.exiting ? "toast-exit" : "toast-enter"
            }`}
            style={{
              background: "var(--bg-raised)",
              border: `1px solid ${config.border}`,
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <Icon size={16} />
            <p className="text-[13px] font-medium flex-1 leading-snug" style={{ color: config.fg }}>
              {toast.message}
            </p>
            <button
              className="shrink-0 p-0.5 rounded transition-opacity hover:opacity-60"
              onClick={() => removeToast(toast.id)}
              style={{ color: "var(--fg-dim)" }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
