-- This is a placeholder migration file
-- It was created to fix a deployment issue
-- You should replace this with your actual migration when needed

-- CreateTable
CREATE TABLE "MentorSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MentorSession_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MentorSession" ADD CONSTRAINT "MentorSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; 