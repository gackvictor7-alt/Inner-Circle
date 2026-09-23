"use client";

import { useId, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/icons";
import { useI18n } from "@/lib/i18n/context";

/** Same minimum as the real connect dialog, so the demo teaches the real habit. */
const DEMO_MESSAGE_MIN = 20;
const DEMO_MESSAGE_MAX = 600;

/**
 * Simulated contact request for demo profiles (Sprint 7, reworked in Sprint 11).
 *
 * The flow mirrors the real one – a short personal message, then a clear
 * confirmation – but it is entirely client-side: no server action, no
 * request row, no message, no notification, no counter. Demo members have no
 * database rows, so there is nothing a request could even be attached to.
 */
export function DemoConnectDialog({
  open,
  onClose,
  targetName,
}: {
  open: boolean;
  onClose: () => void;
  /** First name of the fictional profile; falls back to a neutral wording. */
  targetName?: string;
}) {
  const { t, tf } = useI18n();
  const [message, setMessage] = useState("");
  const [touched, setTouched] = useState(false);
  const [done, setDone] = useState(false);
  const fieldId = useId();
  const hintId = `${fieldId}-hint`;

  const trimmed = message.trim();
  const valid = trimmed.length >= DEMO_MESSAGE_MIN;
  const name = targetName?.trim() || t.app.demo.discoverDetailTitle;

  const close = () => {
    onClose();
    // Reset after the dialog closed so a re-open starts fresh.
    setMessage("");
    setTouched(false);
    setDone(false);
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      title={done ? t.app.demo.connectDoneTitle : t.app.demo.connectTitle}
      closeLabel={t.app.common.close}
      footer={
        done ? (
          <>
            <Button size="sm" variant="secondary" onClick={close}>
              {t.app.common.close}
            </Button>
            <Button size="sm" href="/app/billing">
              {t.app.access.upgradeCta}
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="ghost" onClick={close}>
              {t.app.common.cancel}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setTouched(true);
                if (valid) setDone(true);
              }}
              aria-disabled={!valid}
            >
              {t.app.demo.connectSubmit}
            </Button>
          </>
        )
      }
    >
      {done ? (
        <div role="status" aria-live="polite">
          <p className="flex items-start gap-2 text-sm leading-6 text-foreground">
            <CheckIcon size={18} className="mt-1 shrink-0 text-forest-500" />
            <span>{t.app.demo.connectDoneText}</span>
          </p>
          <p className="mt-3 text-xs leading-5 text-foreground-subtle">{t.app.demo.notice}</p>
        </div>
      ) : (
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            setTouched(true);
            if (valid) setDone(true);
          }}
        >
          <p className="text-sm leading-6 text-foreground-muted">{tf(t.app.demo.connectLead, { name })}</p>
          <p className="mt-2 inline-flex rounded-full border border-sand-400/40 bg-sand-200/40 px-2.5 py-0.5 text-[11px] font-semibold text-sand-800 dark:bg-sand-400/10 dark:text-sand-100">
            {t.app.demo.profileBadge}
          </p>
          <label htmlFor={fieldId} className="mt-4 block text-xs font-semibold text-foreground-muted">
            {t.app.demo.connectMessageLabel}
          </label>
          <textarea
            id={fieldId}
            name="message"
            value={message}
            onChange={(event) => setMessage(event.target.value.slice(0, DEMO_MESSAGE_MAX))}
            onBlur={() => setTouched(true)}
            rows={4}
            maxLength={DEMO_MESSAGE_MAX}
            placeholder={t.app.demo.connectMessagePlaceholder}
            aria-describedby={hintId}
            aria-invalid={touched && !valid ? true : undefined}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-electric-500 focus:outline-none"
          />
          <p
            id={hintId}
            className={`mt-1.5 text-xs ${touched && !valid ? "text-danger-600 dark:text-danger-300" : "text-foreground-subtle"}`}
          >
            {tf(t.app.demo.connectMinLength, { min: DEMO_MESSAGE_MIN })} · {trimmed.length}/{DEMO_MESSAGE_MAX}
          </p>
        </form>
      )}
    </Dialog>
  );
}
