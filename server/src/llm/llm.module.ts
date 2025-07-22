import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LlmProvider, LlmModel } from "./entities";
import { LlmController } from "./llm.controller";
import { LlmService } from "./llm.service";

@Module({
  imports: [TypeOrmModule.forFeature([LlmProvider, LlmModel])],
  providers: [LlmService],
  controllers: [LlmController],
  exports: [TypeOrmModule, LlmService],
})
export class LlmModule {}
