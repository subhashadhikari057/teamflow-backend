CREATE TABLE "message_attachments" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "relativePath" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "optimized" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_attachments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "message_attachments_messageId_idx" ON "message_attachments"("messageId");

ALTER TABLE "message_attachments"
ADD CONSTRAINT "message_attachments_messageId_fkey"
FOREIGN KEY ("messageId") REFERENCES "messages"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
