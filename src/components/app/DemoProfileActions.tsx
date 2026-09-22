"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { UserPlusIcon } from "@/components/ui/icons";
import { useI18n } from "@/lib/i18n/context";
import { DemoConnectDialog } from "@/components/app/DemoConnectDialog";

/**
 * Actions row for the demo profile view. "Connect" never sends a real
 * request – it opens the honest demo explanation (Sprint 7).
 */
export function DemoProfileActions() {
  const { t } = useI18n();
  const [demoConnectOpen, setDemoConnectOpen] = useState(false);

  return (
    <>
      <Button size="sm" onClick={() => setDemoConnectOpen(true)}>
        <UserPlusIcon size={15} />
        {t.app.network.connectCta}
      </Button>
      <DemoConnectDialog open={demoConnectOpen} onClose={() => setDemoConnectOpen(false)} />
    </>
  );
}
