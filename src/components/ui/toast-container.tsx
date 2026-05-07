"use client";

import { useToast } from "@/contexts/toast-context";

const ICONS: Record<string, string> = {
  success: "M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4 12 14.01 9 11.01",
  error: "M12 9v4m0 4h.01 M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z",
  info: "M12 16v-4m0-4h.01 M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z",
};

const COLORS: Record<string, { bg: string; fg: string; border: string }> = {
  success: { bg: "var(--green-dim)", fg: "var(--green)", border: "var(--green)" },
  error: { bg: "var(--red-dim)", fg: "var(--red)", border: "var(--red)" },
  info: { bg: "var(--yellow-dim)", fg: "#92400E", border: "var(--yellow)" },
};

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 right-4 z-[200] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const colors = COLORS[toast.type] || COLORS.info;
        const icon = ICONS[toast.type] || ICONS.info;

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-xl p-3 flex items-start gap-3 ${
              toast.exiting ? "toast-exit" : "toast-enter"
            }`}
            style={{
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={colors.fg}
              strokeWidth="2"
              className="shrink-0 mt-0.5"
            >
              <path d={icon} />
            </svg>
            <p className="text-sm font-medium flex-1" style={{ color: colors.fg }}>
              {toast.message}
            </p>
            <button
              className="shrink-0 p-0.5 rounded hover:opacity-70 transition-opacity"
              onClick={() => removeToast(toast.id)}
              style={{ color: colors.fg }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
