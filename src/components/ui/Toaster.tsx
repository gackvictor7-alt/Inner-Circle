"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { AlertIcon, CheckCircleIcon, InfoIcon, XIcon } from "./icons";

export type ToastVariant = "info" | "success" | "error";

type ToastItem = { id: number; message: string; variant: ToastVariant };

const TOAST_EVENT = "ic:toast";
let toastCounter = 0;

/** Fire-and-forget toast. Render <Toaster/> once in the root layout. */
export function toast(message: string, variant: ToastVariant = "info") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<Omit<ToastItem, "id">>(TOAST_EVENT, { detail: { message, variant } }),
  );
}

const icons: Record<ToastVariant, typeof InfoIcon> = {
  info: InfoIcon,
  success: CheckCircleIcon,
  error: AlertIcon,
};

const iconColors: Record<ToastVariant, string> = {
  info: "text-electric-500",
  success: "text-success-500",
  error: "text-danger-500",
};

export function Toaster() {
  const { t } = useI18n();
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<Omit<ToastItem, "id">>).detail;
      const id = ++toastCounter;
      setItems((prev) => [...prev.slice(-2), { id, ...detail }]);
      window.setTimeout(() => {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }, 4500);
    };
    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, []);

  if (items.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-5 right-4 z-[110] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2 sm:right-6"
    >
      {items.map((item) => {
        const Icon = icons[item.variant];
        return (
          <div
            key={item.id}
            role={item.variant === "error" ? "alert" : "status"}
            className="pointer-events-auto flex animate-toast-in items-start gap-3 rounded-xl border border-border bg-surface-raised p-4 shadow-pop"
          >
            <Icon size={20} className={`mt-0.5 shrink-0 ${iconColors[item.variant]}`} />
            <p className="flex-1 text-sm font-medium leading-5 text-foreground">{item.message}</p>
            <button
              type="button"
              aria-label={t.nav.menuClose}
              onClick={() => setItems((prev) => prev.filter((entry) => entry.id !== item.id))}
              className="rounded-full p-1 text-foreground-subtle transition-colors hover:bg-surface-muted hover:text-foreground"
            >
              <XIcon size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
