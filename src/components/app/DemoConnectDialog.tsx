"use client";

import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n/context";

/**
 * Explains – instead of sending – that demo profiles never create real
 * connections (Sprint 7). Demo members have no database rows, so the
 * mandatory-message connect dialog would only produce a confusing error;
 * this dialog answers the "Connect" action honestly and visibly.
 */
export function DemoConnectDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t.app.demo.discoverDetailTitle}
      closeLabel={t.app.common.close}
      footer={
        <Button size="sm" variant="secondary" onClick={onClose}>
          {t.app.common.close}
        </Button>
      }
    >
      <p className="text-sm leading-6 text-foreground-muted">{t.app.demo.discoverDemoNotice}</p>
      <p className="mt-3 text-xs leading-5 text-foreground-subtle">{t.app.demo.notice}</p>
    </Dialog>
  );
}
