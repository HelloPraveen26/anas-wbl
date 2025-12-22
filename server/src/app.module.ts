import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ThrottlerModule } from "@nestjs/throttler";
import { WinstonModule } from "nest-winston";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { DatabaseModule } from "./database/database.module";
import { CommonModule } from "./common/common.module";
import { HealthModule } from "./health/health.module";
import { LlmModule } from "./llm/llm.module";
import { TranscriberModule } from "./transcriber/transcriber.module";
import { SynthesizerModule } from "./synthesizer/synthesizer.module";
import { RealtimeModule } from "./realtime/realtime.module";
import { AssistantModule } from "./assistant/assistant.module";
import { PromptModule } from "./prompt/prompt.module";
import { PhoneModule } from "./phone/phone.module";
import { RegisteredNumbersModule } from "./registered-numbers/registered-numbers.module";
import { ContactNumbersModule } from "./contact-numbers/contact-numbers.module";
import { CallLogsModule } from "./call-logs/call-logs.module";
import { winstonConfig } from "./config/winston.config";
import { databaseConfig } from "./config/database.config";
import { throttlerConfig } from "./config/throttler.config";

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),

    // Winston Logger
    WinstonModule.forRootAsync({
      useFactory: (configService: ConfigService) =>
        winstonConfig(configService),
      inject: [ConfigService],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) =>
        databaseConfig(configService),
      inject: [ConfigService],
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      useFactory: (configService: ConfigService) =>
        throttlerConfig(configService),
      inject: [ConfigService],
    }),

    // Feature Modules
    DatabaseModule,
    CommonModule,
    HealthModule,
    AuthModule,
    UsersModule,
    LlmModule,
    TranscriberModule,
    SynthesizerModule,
    RealtimeModule,
    AssistantModule,
    PromptModule,
    PhoneModule,
    RegisteredNumbersModule,
    ContactNumbersModule,
    CallLogsModule,
  ],
})
export class AppModule {}
