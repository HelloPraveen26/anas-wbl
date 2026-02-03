import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Assistant, ToolConfig } from "./entities";
import { AssistantController } from "./assistant.controller";
import { AssistantService } from "./assistant.service";
import { LlmModule } from "../llm/llm.module";
import { TranscriberModule } from "../transcriber/transcriber.module";
import { SynthesizerModule } from "../synthesizer/synthesizer.module";
import { RealtimeModule } from "../realtime/realtime.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Assistant, ToolConfig]),
    LlmModule,
    TranscriberModule,
    SynthesizerModule,
    RealtimeModule,
  ],
  providers: [AssistantService],
  controllers: [AssistantController],
  exports: [TypeOrmModule, AssistantService],
})
export class AssistantModule { }
