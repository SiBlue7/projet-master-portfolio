CREATE TABLE "project_media" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "imageData" BYTEA NOT NULL,
  "altText" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "project_media_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "project_media_projectId_idx" ON "project_media"("projectId");

CREATE INDEX "project_media_sortOrder_idx" ON "project_media"("sortOrder");

ALTER TABLE "project_media"
ADD CONSTRAINT "project_media_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "projects"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
