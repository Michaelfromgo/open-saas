/*
  Warnings:

  - You are about to drop the `LifeCoachAchievement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LifeCoachCheckIn` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LifeCoachInsight` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LifeCoachProfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LifeCoachReflection` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "LifeCoachAchievement" DROP CONSTRAINT "LifeCoachAchievement_profileId_fkey";

-- DropForeignKey
ALTER TABLE "LifeCoachCheckIn" DROP CONSTRAINT "LifeCoachCheckIn_profileId_fkey";

-- DropForeignKey
ALTER TABLE "LifeCoachInsight" DROP CONSTRAINT "LifeCoachInsight_profileId_fkey";

-- DropForeignKey
ALTER TABLE "LifeCoachProfile" DROP CONSTRAINT "LifeCoachProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "LifeCoachReflection" DROP CONSTRAINT "LifeCoachReflection_profileId_fkey";

-- DropTable
DROP TABLE "LifeCoachAchievement";

-- DropTable
DROP TABLE "LifeCoachCheckIn";

-- DropTable
DROP TABLE "LifeCoachInsight";

-- DropTable
DROP TABLE "LifeCoachProfile";

-- DropTable
DROP TABLE "LifeCoachReflection";

-- CreateTable
CREATE TABLE "LifeCoachGoal" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "goalDescription" TEXT NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "checkinFrequency" TEXT NOT NULL DEFAULT 'daily',
    "notificationPreferences" TEXT NOT NULL DEFAULT 'in-app',

    CONSTRAINT "LifeCoachGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyCheckin" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "goalId" TEXT NOT NULL,
    "checkinDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actionCompleted" BOOLEAN NOT NULL,
    "comments" TEXT,

    CONSTRAINT "DailyCheckin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklySummary" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "goalId" TEXT NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "weekEndDate" TIMESTAMP(3) NOT NULL,
    "summaryText" TEXT NOT NULL,
    "motivationalMessage" TEXT NOT NULL,
    "actionableTip" TEXT NOT NULL,

    CONSTRAINT "WeeklySummary_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LifeCoachGoal" ADD CONSTRAINT "LifeCoachGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyCheckin" ADD CONSTRAINT "DailyCheckin_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "LifeCoachGoal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklySummary" ADD CONSTRAINT "WeeklySummary_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "LifeCoachGoal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
