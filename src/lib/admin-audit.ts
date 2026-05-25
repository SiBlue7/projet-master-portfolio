import type { Session } from "next-auth";
import type { WriteAuditLogInput } from "@/lib/audit";
import { tryWriteAuditLog } from "@/lib/audit";

type WriteAdminAuditLogInput = Omit<WriteAuditLogInput, "actor"> & {
  session: Session;
};

export async function writeAdminAuditLog({
  session,
  ...auditLog
}: WriteAdminAuditLogInput) {
  await tryWriteAuditLog({
    ...auditLog,
    actor: {
      email: session.user.email,
      id: session.user.id,
      pseudo: session.user.pseudo ?? session.user.name,
    },
  });
}
