"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { UserPlusIcon } from "@/components/ui/icons";
import { useI18n } from "@/lib/i18n/context";
import { DemoConnectDialog } from "@/components/app/DemoConnectDialog";

/**
 * Actions row for the demo profile view. "Kontakt anfragen" never sends a real
 * request – it runs the simulated, client-only request flow (Sprint 7/11).
 */
export function DemoProfileActions({ targetName }: { targetName?: string }) {
  const { t } = useI18n();
  const [demoConnectOpen, setDemoConnectOpen] = useState(false);

  return (
    <>
      <Button size="sm" onClick={() => setDemoConnectOpen(true)}>
        <UserPlusIcon size={15} />
        {t.app.demo.connectTitle}
      </Button>
      <DemoConnectDialog
        open={demoConnectOpen}
        onClose={() => setDemoConnectOpen(false)}
        targetName={targetName}
      />
    </>
  );
}
