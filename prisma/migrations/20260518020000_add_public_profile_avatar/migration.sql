ALTER TABLE "public_profiles"
ADD COLUMN "avatarData" BYTEA,
ADD COLUMN "avatarMimeType" TEXT,
ADD COLUMN "avatarUpdatedAt" TIMESTAMP(3);
