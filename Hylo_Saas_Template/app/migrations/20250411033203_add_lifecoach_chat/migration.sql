-- CreateTable
CREATE TABLE "LifeCoachChatMessage" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "goalId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "isUserMessage" BOOLEAN NOT NULL DEFAULT true,
    "content" TEXT NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "LifeCoachChatMessage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LifeCoachChatMessage" ADD CONSTRAINT "LifeCoachChatMessage_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "LifeCoachGoal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
