import "server-only";

import { db } from "@/db/client";
import { adminAuditLog } from "@/db/schema";
import { idFor } from "@/db/ids";

/**
 * Administrative audit trail. Every privileged or security-relevant action is
 * recorded here (spec §53: audit logs).
 */
export async function audit(entry: {
  actorId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.insert(adminAuditLog).values({
      id: idFor.audit(),
      actorId: entry.actorId ?? null,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      metaJson: JSON.stringify(entry.meta ?? {}),
      createdAt: new Date(),
    });
  } catch {
    // Auditing must never break the user-facing action.
  }
}
