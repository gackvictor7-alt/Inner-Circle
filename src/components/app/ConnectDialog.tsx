"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Textarea } from "@/components/ui/Input";
import { toast } from "@/components/ui/Toaster";
import { useI18n } from "@/lib/i18n/context";
import { sendConnectionRequestAction } from "@/app/actions/network";
import { initialActionState } from "@/app/actions/state";
import { CONNECTION_MESSAGE_MAX_LENGTH, CONNECTION_MESSAGE_MIN_LENGTH } from "@/lib/platform/rules";

/**
 * Mandatory connection message (spec §7).
 *
 * Every "Connect" in INNER CIRCLE goes through this dialog – from Discover,
 * the directory and a member profile. The server refuses requests without a
 * message of at least {@link CONNECTION_MESSAGE_MIN_LENGTH} characters, so the client
 * check is a convenience, never the gate.
 */
export function ConnectDialog({
  open,
  onClose,
  target,
  onSent,
}: {
  open: boolean;
  onClose: () => void;
  target: { id: string; handle: string; firstName: string };
  onSent?: () => void;
}) {
  // Callers mount this dialog only while a target is selected, so the message
  // field is always fresh – no reset effect needed.
  const { t, tf } = useI18n();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [state, action, pending] = useActionState(sendConnectionRequestAction, initialActionState);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (state.status !== "success") return;
    onSent?.();
    onClose();
    if (state.messageCode === "connectedMutual") {
      // The other side had already asked – you are connected now.
      toast(tf(t.app.beta.connectedMutualToast, { name: target.firstName }), "success");
      if (state.entityId) {
        router.push(`/app/inbox?tab=messages&c=${state.entityId}`);
        return;
      }
    } else {
      toast(tf(t.app.beta.requestSentToast, { name: target.firstName }), "success");
    }
    router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  const trimmed = message.trim();
  const tooShort = trimmed.length < CONNECTION_MESSAGE_MIN_LENGTH;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={tf(t.app.discover.connectTitle, { name: target.firstName })}
      description={t.app.discover.connectLead}
      closeLabel={t.app.common.close}
    >
      <form action={action} className="space-y-3">
        <input type="hidden" name="userId" value={target.id} />
        <input type="hidden" name="handle" value={target.handle} />

        <Textarea
          label={t.app.inbox.requestsMessage}
          requiredMark
          name="message"
          rows={4}
          maxLength={CONNECTION_MESSAGE_MAX_LENGTH}
          required
          minLength={CONNECTION_MESSAGE_MIN_LENGTH}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onBlur={() => setTouched(true)}
          placeholder={t.app.discover.connectPlaceholder}
        />

        <div id="connect-message-hint" className="flex items-center justify-between gap-3 text-xs">
          <span className={touched && tooShort ? "text-danger-600 dark:text-danger-300" : "text-foreground-subtle"}>
            {touched && tooShort ? t.app.discover.connectRequired : t.app.discover.connectMinHint}
          </span>
          <span className="font-mono text-foreground-subtle">
            {tf(t.app.discover.connectCounter, { count: trimmed.length })}
          </span>
        </div>

        {state.status === "error" && (
          <p role="alert" className="rounded-xl bg-danger-500/10 px-3.5 py-2.5 text-sm text-danger-700 dark:text-danger-200">
            {tf(
              (t.app.errors[(state.errorCode ?? "generic") as keyof typeof t.app.errors] as string | undefined) ??
                t.app.errors.generic,
              state.errorParams ?? {},
            )}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t.app.discover.connectCancel}
          </Button>
          <Button type="submit" loading={pending} disabled={tooShort}>
            {t.app.discover.connectSend}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
