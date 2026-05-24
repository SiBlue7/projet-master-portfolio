ALTER TABLE "projects"
ADD COLUMN "githubPushedAt" TIMESTAMP(3),
ADD COLUMN "githubVisibility" TEXT,
ADD COLUMN "githubIsPrivate" BOOLEAN,
ADD COLUMN "githubReadme" TEXT;

CREATE INDEX "projects_githubPushedAt_idx" ON "projects"("githubPushedAt");
CREATE INDEX "projects_githubVisibility_idx" ON "projects"("githubVisibility");
