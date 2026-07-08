"use client";

import { useEffect } from "react";

export type NotificationToastTone = "info" | "success" | "warning" | "error";

export type NotificationToastState = {
  id: number;
  title: string;
  message?: string;
  tone?: NotificationToastTone;
};

type NotificationToastProps = {
  notification: NotificationToastState | null;
  onClose: () => void;
  durationMs?: number;
};

const toneClasses: Record<NotificationToastTone, string> = {
  info: "border-zinc-200 bg-white text-zinc-950",
  success: "border-emerald-200 bg-emerald-50 text-emerald-950",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
  error: "border-red-200 bg-red-50 text-red-950",
};

export function NotificationToast({
  notification,
  onClose,
  durationMs = 5000,
}: NotificationToastProps) {
  useEffect(() => {
    if (!notification) {
      return;
    }

    const timeoutId = window.setTimeout(onClose, durationMs);

    return () => window.clearTimeout(timeoutId);
  }, [durationMs, notification, onClose]);

  if (!notification) {
    return null;
  }

  return (
    <div className="fixed right-4 top-4 z-50 w-[calc(100vw-2rem)] max-w-sm">
      <div
        className={`rounded-lg border p-4 shadow-lg ${
          toneClasses[notification.tone ?? "info"]
        }`}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <strong className="text-sm font-semibold">
              {notification.title}
            </strong>
            {notification.message ? (
              <p className="mt-1 text-sm opacity-80">{notification.message}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 text-sm opacity-60 hover:opacity-100"
            aria-label="Fechar notificacao"
          >
            x
          </button>
        </div>
      </div>
    </div>
  );
}
