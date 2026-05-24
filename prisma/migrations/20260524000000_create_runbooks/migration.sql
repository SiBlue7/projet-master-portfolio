CREATE TYPE "RunbookEnvironmentKind" AS ENUM ('LOCAL', 'PREPROD', 'PRODUCTION', 'OTHER');

CREATE TYPE "RunbookStepType" AS ENUM ('MANUAL', 'COMMAND', 'HTTP_REQUEST');

CREATE TABLE "runbooks" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "runbooks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "runbook_environments" (
  "id" TEXT NOT NULL,
  "runbookId" TEXT NOT NULL,
  "kind" "RunbookEnvironmentKind" NOT NULL DEFAULT 'OTHER',
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "baseUrl" TEXT,
  "variables" JSONB,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "runbook_environments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "runbook_steps" (
  "id" TEXT NOT NULL,
  "runbookId" TEXT NOT NULL,
  "environmentId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "type" "RunbookStepType" NOT NULL DEFAULT 'MANUAL',
  "command" TEXT,
  "url" TEXT,
  "httpMethod" TEXT,
  "payload" JSONB,
  "expectedResult" TEXT,
  "isExecutable" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "runbook_steps_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "runbooks_projectId_slug_key" ON "runbooks"("projectId", "slug");

CREATE INDEX "runbooks_projectId_idx" ON "runbooks"("projectId");

CREATE INDEX "runbooks_sortOrder_idx" ON "runbooks"("sortOrder");

CREATE UNIQUE INDEX "runbook_environments_runbookId_slug_key" ON "runbook_environments"("runbookId", "slug");

CREATE INDEX "runbook_environments_runbookId_idx" ON "runbook_environments"("runbookId");

CREATE INDEX "runbook_environments_kind_idx" ON "runbook_environments"("kind");

CREATE INDEX "runbook_environments_sortOrder_idx" ON "runbook_environments"("sortOrder");

CREATE INDEX "runbook_steps_runbookId_idx" ON "runbook_steps"("runbookId");

CREATE INDEX "runbook_steps_environmentId_idx" ON "runbook_steps"("environmentId");

CREATE INDEX "runbook_steps_type_idx" ON "runbook_steps"("type");

CREATE INDEX "runbook_steps_sortOrder_idx" ON "runbook_steps"("sortOrder");

ALTER TABLE "runbooks"
ADD CONSTRAINT "runbooks_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "projects"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "runbook_environments"
ADD CONSTRAINT "runbook_environments_runbookId_fkey"
FOREIGN KEY ("runbookId") REFERENCES "runbooks"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "runbook_steps"
ADD CONSTRAINT "runbook_steps_runbookId_fkey"
FOREIGN KEY ("runbookId") REFERENCES "runbooks"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "runbook_steps"
ADD CONSTRAINT "runbook_steps_environmentId_fkey"
FOREIGN KEY ("environmentId") REFERENCES "runbook_environments"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
