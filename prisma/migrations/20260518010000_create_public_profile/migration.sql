CREATE TABLE "public_profiles" (
  "id" TEXT NOT NULL DEFAULT 'public-profile',
  "displayName" TEXT NOT NULL,
  "headline" TEXT NOT NULL,
  "bio" TEXT NOT NULL,
  "contactEmail" TEXT NOT NULL,
  "githubUrl" TEXT,
  "linkedinUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "public_profiles_pkey" PRIMARY KEY ("id")
);
