-- DropForeignKey
ALTER TABLE "AgentSubTask" DROP CONSTRAINT "AgentSubTask_taskId_fkey";

-- AlterTable
ALTER TABLE "AgentSubTask" ADD COLUMN     "error" TEXT,
ADD COLUMN     "isLeftoverFrom" TEXT,
ADD COLUMN     "leftoverFor" TEXT,
ALTER COLUMN "toolInput" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'pending';

-- AlterTable
ALTER TABLE "AgentTask" ALTER COLUMN "status" SET DEFAULT 'planning';

-- AlterTable
ALTER TABLE "UserMealPreferences" ALTER COLUMN "calorieTarget" SET DEFAULT 2000,
ALTER COLUMN "mealsPerDay" SET DEFAULT 3,
ALTER COLUMN "dietType" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "allergies" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "cuisines" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "prepTime" SET DEFAULT '30 min';

-- AddForeignKey
ALTER TABLE "AgentSubTask" ADD CONSTRAINT "AgentSubTask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "AgentTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
