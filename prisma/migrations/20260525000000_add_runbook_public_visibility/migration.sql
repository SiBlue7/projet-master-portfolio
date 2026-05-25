ALTER TABLE "runbooks"
ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "runbooks_isPublic_idx" ON "runbooks"("isPublic");
