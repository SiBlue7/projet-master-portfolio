CREATE TYPE "ProfileTimelineItemType" AS ENUM ('FORMATION', 'EXPERIENCE', 'CERTIFICATION');

CREATE TABLE "profile_timeline_items" (
  "id" TEXT NOT NULL,
  "type" "ProfileTimelineItemType" NOT NULL,
  "title" TEXT NOT NULL,
  "organization" TEXT NOT NULL,
  "location" TEXT,
  "description" TEXT,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "isCurrent" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "profile_timeline_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "profile_timeline_items_type_idx" ON "profile_timeline_items"("type");

CREATE INDEX "profile_timeline_items_sortOrder_idx" ON "profile_timeline_items"("sortOrder");

CREATE INDEX "profile_timeline_items_startDate_idx" ON "profile_timeline_items"("startDate");
