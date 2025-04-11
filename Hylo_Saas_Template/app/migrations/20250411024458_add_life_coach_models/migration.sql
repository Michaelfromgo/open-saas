-- CreateTable
CREATE TABLE "LifeCoachProfile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "goals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "focusAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "personalValues" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "checkInFrequency" TEXT NOT NULL DEFAULT 'daily',
    "preferredCheckInTime" TEXT NOT NULL DEFAULT '09:00',

    CONSTRAINT "LifeCoachProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LifeCoachCheckIn" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "profileId" TEXT NOT NULL,
    "checkInDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mood" INTEGER NOT NULL DEFAULT 5,
    "energy" INTEGER NOT NULL DEFAULT 5,
    "focus" INTEGER NOT NULL DEFAULT 5,
    "stress" INTEGER NOT NULL DEFAULT 5,
    "sleep" INTEGER,
    "dailyWin" TEXT,
    "dailyChallenge" TEXT,
    "gratitude" TEXT,
    "intentions" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "aiAnalysis" JSONB,

    CONSTRAINT "LifeCoachCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LifeCoachReflection" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "profileId" TEXT NOT NULL,
    "reflectionType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "summary" TEXT NOT NULL,
    "insights" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "strengths" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "improvements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "recommendations" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "LifeCoachReflection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LifeCoachAchievement" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "achievedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" TEXT NOT NULL,
    "celebrationType" TEXT,

    CONSTRAINT "LifeCoachAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LifeCoachInsight" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "profileId" TEXT NOT NULL,
    "insightType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "relatedCheckIns" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'new',

    CONSTRAINT "LifeCoachInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LifeCoachProfile_userId_key" ON "LifeCoachProfile"("userId");

-- AddForeignKey
ALTER TABLE "LifeCoachProfile" ADD CONSTRAINT "LifeCoachProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LifeCoachCheckIn" ADD CONSTRAINT "LifeCoachCheckIn_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "LifeCoachProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LifeCoachReflection" ADD CONSTRAINT "LifeCoachReflection_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "LifeCoachProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LifeCoachAchievement" ADD CONSTRAINT "LifeCoachAchievement_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "LifeCoachProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LifeCoachInsight" ADD CONSTRAINT "LifeCoachInsight_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "LifeCoachProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
