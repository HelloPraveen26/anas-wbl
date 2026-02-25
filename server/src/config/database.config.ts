import { ConfigService } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { User } from "../users/entities/user.entity";
import { LlmProvider, LlmModel } from "../llm/entities";
import {
  TranscriberProvider,
  TranscriberModel,
  SttConfig,
} from "../transcriber/entities";
import {
  SynthesizerProvider,
  SynthesizerModel,
  TtsConfig,
} from "../synthesizer/entities";
import {
  RealtimeProvider,
  RealtimeModel,
  RealtimeConfig,
} from "../realtime/entities";
import { Assistant } from "../assistant/entities";
import { RegisteredNumber } from "../registered-numbers/entities/registered-number.entity";
import { ContactNumber } from "../contact-numbers/entities/contact-number.entity";
import { CallLog } from "../call-logs/entities/call-log.entity";
import { ChatLog } from "../chat-logs/entities/chat-log.entity";
import { Payment } from "../payment/entities/payment.entity";
import { ToolConfig } from "../assistant/entities/tool-config.entity";
import { File } from "../file-storage/entities/file.entity";

export const databaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: "postgres",
  host: configService.get("DATABASE_HOST"),
  port: configService.get("DATABASE_PORT"),
  username: configService.get("DATABASE_USERNAME"),
  password: configService.get("DATABASE_PASSWORD"),
  database: configService.get("DATABASE_NAME"),
  entities: [
    User,
    LlmProvider,
    LlmModel,
    TranscriberProvider,
    TranscriberModel,
    SttConfig,
    SynthesizerProvider,
    SynthesizerModel,
    TtsConfig,
    RealtimeProvider,
    RealtimeModel,
    RealtimeConfig,
    Assistant,
    RegisteredNumber,
    ContactNumber,
    CallLog,
    ChatLog,
    Payment,
    ToolConfig,
    File,
  ],
  synchronize: configService.get("NODE_ENV") === "development",
  logging: configService.get("NODE_ENV") === "development",
  ssl:
    configService.get("NODE_ENV") === "production"
      ? { rejectUnauthorized: false }
      : false,
  migrations: ["dist/database/migrations/*.js"],
  migrationsRun: true,
});
