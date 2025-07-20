import { DataSource } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { config } from "dotenv";
import { User } from "../users/entities/user.entity";
import { LlmProvider, LlmModel } from "../llm/entities";
import { TranscriberProvider, TranscriberModel } from "../transcriber/entities";
import {
  SynthesizerProvider,
  SynthesizerModel,
  SynthesizerVoice,
} from "../synthesizer/entities";
import { Assistant } from "../assistant/entities";

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
    SynthesizerProvider,
    SynthesizerModel,
    SynthesizerVoice,
    Assistant,
  ],
  migrations: [__dirname + "/migrations/*.{ts,js}"],
  migrationsTableName: "migrations",
  synchronize: false,
});
