-- AlterTable
ALTER TABLE "UserMealPreferences" ADD COLUMN     "breakfastOptions" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "measurementSystem" TEXT NOT NULL DEFAULT 'us',
ADD COLUMN     "repeatBreakfast" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "useLeftovers" BOOLEAN NOT NULL DEFAULT true;
