"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { XIcon } from "./icons";

/**
 * Accessible modal dialog: portal render, focus trap, Escape/backdrop close,
 * body scroll lock, focus restore. Used across the platform (member area
 * confirmations, short forms, previews).
 *
 * Mobile shape (2026-09-28): below `sm` the dialog is a bottom sheet that
 * never grows past the visible viewport (`svh`, not `vh`, so the iOS browser
 * bar cannot cut it off), scrolls internally and keeps its title + X pinned
 * above the scrolling body. The close mechanism therefore stays visible with
 * 40 people in the list, and the footer (CTA) can never be pushed out of
 * reach. From `sm` upwards the centred card is unchanged.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  closeLabel = "Close",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  /** Accessible name for the X button (i18n supplied by the caller). */
  closeLabel?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    // Move focus into the dialog.
    const panel = panelRef.current;
    panel?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key === "Tab" && panel) {
        const focusables = panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 animate-fade-in bg-midnight-950/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ic-dialog-title"
        aria-describedby={description ? "ic-dialog-desc" : undefined}
        tabIndex={-1}
        className="relative flex max-h-[88svh] w-full animate-scale-in flex-col overflow-hidden rounded-t-2xl border border-border bg-surface shadow-pop outline-none sm:max-h-[85svh] sm:max-w-lg sm:rounded-2xl"
      >
        {/* Pinned head: title + X are always reachable, even with a long list. */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 pt-5 pb-4 sm:px-7 sm:pt-6">
          <div className="min-w-0">
            <h2 id="ic-dialog-title" className="text-lg font-bold tracking-tight">
              {title}
            </h2>
            {description && (
              <p id="ic-dialog-desc" className="mt-1.5 text-sm leading-6 text-foreground-muted">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="-mt-1.5 -mr-1.5 shrink-0 rounded-full p-2 text-foreground-subtle transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            <XIcon size={18} />
          </button>
        </div>

        {children && (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-7 sm:py-5">
            {children}
          </div>
        )}

        {footer && (
          <div className="shrink-0 border-t border-border px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] sm:px-7 sm:pb-5">
            <div className="flex flex-wrap justify-end gap-3">{footer}</div>
          </div>
        )}
        {!footer && children && (
          <div
            aria-hidden="true"
            className="h-[max(0.75rem,env(safe-area-inset-bottom,0px))] shrink-0"
          />
        )}
      </div>
    </div>,
    document.body,
  );
}
