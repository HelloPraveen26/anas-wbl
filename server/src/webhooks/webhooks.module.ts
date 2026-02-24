import { Module } from "@nestjs/common";
import { WebhooksController } from "./webhooks.controller";
import { CallLogsModule } from "../call-logs/call-logs.module";

@Module({
  imports: [CallLogsModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
