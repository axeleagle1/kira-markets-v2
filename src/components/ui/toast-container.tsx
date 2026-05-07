"use client";

import { useToast } from "@/contexts/toast-context";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const CONFIG: Record<string, { icon: React.ComponentType<{ size?: number }>; color: string }> = {
  success: { icon: CheckCircle2, color: "var(--green)" },
  error: { icon: AlertCircle, color: "var(--red)" },
  info: { icon: Info, color: "var(--yellow)" },
};

export function ToastContainer() {
  const { toasts, removeToast } = useToast();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-14 md:bottom-3 right-3 z-[200] flex flex-col gap-1.5 max-w-xs w-full pointer-events-none">
      {toasts.map((toast) => {
        const config = CONFIG[toast.type] || CONFIG.info;
        const Icon = config.icon;
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded px-3 py-2 flex items-start gap-2 ${toast.exiting ? "toast-exit" : "toast-enter"}`}
            style={{
              background: "var(--bg-raised)",
              border: `1px solid var(--border-light)`,
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <Icon size={14} />
            <p className="text-xs font-medium flex-1 leading-snug" style={{ color: config.color }}>
              {toast.message}
            </p>
            <button className="shrink-0 p-0.5 rounded" style={{ color: "var(--fg-dim)" }} onClick={() => removeToast(toast.id)}>
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
