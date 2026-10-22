CREATE TABLE "channel_message_pins" (
    "channelId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "pinnedBy" TEXT NOT NULL,
    "pinnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "channel_message_pins_pkey" PRIMARY KEY ("channelId","messageId")
);

CREATE UNIQUE INDEX "channel_message_pins_messageId_key" ON "channel_message_pins"("messageId");
CREATE INDEX "channel_message_pins_channelId_pinnedAt_idx" ON "channel_message_pins"("channelId", "pinnedAt");
CREATE INDEX "channel_message_pins_pinnedBy_idx" ON "channel_message_pins"("pinnedBy");

ALTER TABLE "channel_message_pins"
ADD CONSTRAINT "channel_message_pins_channelId_fkey"
FOREIGN KEY ("channelId") REFERENCES "channels"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "channel_message_pins"
ADD CONSTRAINT "channel_message_pins_messageId_fkey"
FOREIGN KEY ("messageId") REFERENCES "messages"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "channel_message_pins"
ADD CONSTRAINT "channel_message_pins_pinnedBy_fkey"
FOREIGN KEY ("pinnedBy") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
