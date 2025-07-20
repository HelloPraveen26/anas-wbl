import { ConfigService } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { User } from "../users/entities/user.entity";
import { LlmProvider, LlmModel } from "../llm/entities";
import { TranscriberProvider, TranscriberModel } from "../transcriber/entities";
import {
  SynthesizerProvider,
  SynthesizerModel,
  SynthesizerVoice,
} from "../synthesizer/entities";

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
    SynthesizerProvider,
    SynthesizerModel,
    SynthesizerVoice,
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
