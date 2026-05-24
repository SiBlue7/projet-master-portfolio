import type {
  AuditLogAction,
  AuditLogStatus,
  Prisma,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type AuditActor = {
  id?: string | null;
  email?: string | null;
  pseudo?: string | null;
};

export type WriteAuditLogInput = {
  action: AuditLogAction;
  actor?: AuditActor | null;
  entityId?: string | null;
  entityType: string;
  ipAddress?: string | null;
  metadata?: Prisma.InputJsonValue | null;
  status?: AuditLogStatus;
  summary: string;
  userAgent?: string | null;
};

export async function writeAuditLog({
  action,
  actor,
  entityId,
  entityType,
  ipAddress,
  metadata,
  status = "SUCCESS",
  summary,
  userAgent,
}: WriteAuditLogInput) {
  await prisma.auditLog.create({
    data: {
      action,
      actorEmail: actor?.email ?? null,
      actorId: actor?.id ?? null,
      actorPseudo: actor?.pseudo ?? null,
      entityId: entityId ?? null,
      entityType,
      ipAddress: ipAddress ?? null,
      metadata: metadata ?? undefined,
      status,
      summary,
      userAgent: userAgent ?? null,
    },
  });
}

export async function tryWriteAuditLog(input: WriteAuditLogInput) {
  try {
    await writeAuditLog(input);
  } catch (error) {
    console.error("Unable to write audit log.", error);
  }
}
