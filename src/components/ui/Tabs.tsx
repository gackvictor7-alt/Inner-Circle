"use client";

import { useId, useRef } from "react";

export type TabItem = { id: string; label: string };

export function Tabs({
  items,
  active,
  onChange,
  label,
}: {
  items: TabItem[];
  active: string;
  onChange: (id: string) => void;
  label: string;
}) {
  const baseId = useId();
  const listRef = useRef<HTMLDivElement>(null);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const index = items.findIndex((item) => item.id === active);
    const next =
      event.key === "ArrowRight"
        ? items[(index + 1) % items.length]
        : items[(index - 1 + items.length) % items.length];
    onChange(next.id);
    listRef.current
      ?.querySelector<HTMLButtonElement>(`#${CSS.escape(baseId + next.id)}`)
      ?.focus();
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className="inline-flex max-w-full flex-wrap items-center gap-1 rounded-full border border-border bg-surface p-1 shadow-card"
    >
      {items.map((item) => {
        const selected = item.id === active;
        return (
          <button
            key={item.id}
            id={`${baseId}${item.id}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`panel-${item.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            className={`rounded-full px-5 py-2 text-[13px] font-semibold tracking-[-0.01em] transition-all duration-200 ${
              selected
                ? "bg-navy-900 text-paper-50 shadow-card"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({
  tabId,
  active,
  children,
}: {
  tabId: string;
  active: string;
  children: React.ReactNode;
}) {
  if (tabId !== active) return null;
  return (
    <div role="tabpanel" id={`panel-${tabId}`} aria-labelledby={`tab-${tabId}`} tabIndex={0}>
      {children}
    </div>
  );
}
