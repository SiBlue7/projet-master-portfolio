CREATE TYPE "AuditLogAction" AS ENUM (
  'LOGIN_SUCCESS',
  'LOGIN_FAILURE',
  'CREATE',
  'UPDATE',
  'DELETE',
  'UPLOAD',
  'EXECUTE'
);

CREATE TYPE "AuditLogStatus" AS ENUM ('SUCCESS', 'FAILURE');

CREATE TABLE "audit_logs" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "actorEmail" TEXT,
  "actorPseudo" TEXT,
  "action" "AuditLogAction" NOT NULL,
  "status" "AuditLogStatus" NOT NULL DEFAULT 'SUCCESS',
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "summary" TEXT NOT NULL,
  "metadata" JSONB,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

CREATE INDEX "audit_logs_status_idx" ON "audit_logs"("status");

CREATE INDEX "audit_logs_entityType_idx" ON "audit_logs"("entityType");

CREATE INDEX "audit_logs_entityId_idx" ON "audit_logs"("entityId");

CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

ALTER TABLE "audit_logs"
ADD CONSTRAINT "audit_logs_actorId_fkey"
FOREIGN KEY ("actorId") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
