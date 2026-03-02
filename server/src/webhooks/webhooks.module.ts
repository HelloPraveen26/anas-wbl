import { Module } from "@nestjs/common";
import { WebhooksController } from "./webhooks.controller";
import { CallLogsModule } from "../call-logs/call-logs.module";
import { ChatLogsModule } from "../chat-logs/chat-logs.module";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [CallLogsModule, ChatLogsModule, UsersModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
