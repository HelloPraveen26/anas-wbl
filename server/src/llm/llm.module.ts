import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LlmProvider, LlmModel } from "./entities";

@Module({
  imports: [TypeOrmModule.forFeature([LlmProvider, LlmModel])],
  providers: [],
  controllers: [],
  exports: [TypeOrmModule],
})
export class LlmModule {}
