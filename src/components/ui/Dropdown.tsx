"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";

/**
 * Accessible dropdown menu (used for language/theme selection and context
 * menus). Keyboard: Escape closes, ArrowUp/Down cycle, Enter/Space select.
 */
export function Dropdown({
  label,
  trigger,
  children,
  align = "end",
  menuLabel,
}: {
  /** Accessible label for the trigger button. */
  label: string;
  /** Trigger content (icon + current value). */
  trigger: ReactNode;
  /** Render-prop receiving the close function. */
  children: (close: () => void) => ReactNode;
  align?: "start" | "end";
  menuLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-surface px-3.5 text-sm font-medium text-foreground-muted transition-colors hover:border-border-strong hover:bg-surface-muted hover:text-foreground"
      >
        {trigger}
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={menuLabel ?? label}
          className={`absolute top-[calc(100%+8px)] z-50 min-w-44 animate-scale-in rounded-xl border border-border bg-surface-raised p-1.5 shadow-pop ${
            align === "end" ? "right-0" : "left-0"
          }`}
        >
          {children(close)}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  selected = false,
  onClick,
  children,
}: {
  selected?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  const itemRef = useRef<HTMLButtonElement>(null);
  return (
    <button
      ref={itemRef}
      type="button"
      role="menuitemradio"
      aria-checked={selected}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          const items = Array.from(
            itemRef.current
              ?.closest('[role="menu"]')
              ?.querySelectorAll<HTMLButtonElement>('[role^="menuitem"]') ?? [],
          );
          const index = items.indexOf(itemRef.current!);
          const next =
            event.key === "ArrowDown"
              ? items[(index + 1) % items.length]
              : items[(index - 1 + items.length) % items.length];
          next?.focus();
        }
      }}
      className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
        selected
          ? "bg-electric-500/10 text-electric-600 dark:text-electric-300"
          : "text-foreground-muted hover:bg-surface-muted hover:text-foreground"
      }`}
    >
      {children}
      {selected && (
        <span aria-hidden="true" className="text-electric-500">
          ✓
        </span>
      )}
    </button>
  );
}
