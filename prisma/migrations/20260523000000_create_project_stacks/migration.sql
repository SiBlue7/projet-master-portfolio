CREATE TABLE "project_stacks" (
  "id" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "project_stacks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_stacks_on_projects" (
  "projectId" TEXT NOT NULL,
  "stackId" TEXT NOT NULL,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "project_stacks_on_projects_pkey" PRIMARY KEY ("projectId", "stackId")
);

CREATE UNIQUE INDEX "project_stacks_slug_key" ON "project_stacks"("slug");

CREATE INDEX "project_stacks_label_idx" ON "project_stacks"("label");

CREATE INDEX "project_stacks_on_projects_stackId_idx" ON "project_stacks_on_projects"("stackId");

ALTER TABLE "project_stacks_on_projects"
ADD CONSTRAINT "project_stacks_on_projects_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "projects"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "project_stacks_on_projects"
ADD CONSTRAINT "project_stacks_on_projects_stackId_fkey"
FOREIGN KEY ("stackId") REFERENCES "project_stacks"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
