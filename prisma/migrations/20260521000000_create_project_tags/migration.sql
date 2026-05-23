CREATE TABLE "project_tags" (
  "id" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "project_tags_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_tags_on_projects" (
  "projectId" TEXT NOT NULL,
  "tagId" TEXT NOT NULL,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "project_tags_on_projects_pkey" PRIMARY KEY ("projectId", "tagId")
);

CREATE UNIQUE INDEX "project_tags_slug_key" ON "project_tags"("slug");
CREATE INDEX "project_tags_label_idx" ON "project_tags"("label");
CREATE INDEX "project_tags_on_projects_tagId_idx" ON "project_tags_on_projects"("tagId");

ALTER TABLE "project_tags_on_projects"
  ADD CONSTRAINT "project_tags_on_projects_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "projects"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "project_tags_on_projects"
  ADD CONSTRAINT "project_tags_on_projects_tagId_fkey"
  FOREIGN KEY ("tagId") REFERENCES "project_tags"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
