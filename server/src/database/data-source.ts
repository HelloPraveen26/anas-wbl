import { DataSource } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { config } from "dotenv";
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
import { Payment } from "../payment/entities/payment.entity";
import { ToolConfig } from "../assistant/entities/tool-config.entity";

config();

const configService = new ConfigService();

export const AppDataSource = new DataSource({
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
    Payment,
    ToolConfig,
  ],
  migrations: [__dirname + "/migrations/*.{ts,js}"],
  migrationsTableName: "migrations",
  synchronize: false,
});
