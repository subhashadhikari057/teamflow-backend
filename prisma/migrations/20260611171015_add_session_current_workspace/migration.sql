-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "currentWorkspaceId" TEXT;

-- CreateIndex
CREATE INDEX "sessions_currentWorkspaceId_idx" ON "sessions"("currentWorkspaceId");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_currentWorkspaceId_fkey" FOREIGN KEY ("currentWorkspaceId") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;
