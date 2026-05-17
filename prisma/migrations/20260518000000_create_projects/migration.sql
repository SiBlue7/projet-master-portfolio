CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED');

CREATE TYPE "ProjectVisibility" AS ENUM ('PRIVATE', 'PUBLIC');

CREATE TABLE "projects" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "shortDescription" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
  "visibility" "ProjectVisibility" NOT NULL DEFAULT 'PRIVATE',
  "repositoryUrl" TEXT,
  "demoUrl" TEXT,
  "startedAt" TIMESTAMP(3),
  "endedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "projects_slug_key" ON "projects"("slug");

CREATE INDEX "projects_status_idx" ON "projects"("status");

CREATE INDEX "projects_visibility_idx" ON "projects"("visibility");

CREATE INDEX "projects_startedAt_idx" ON "projects"("startedAt");
