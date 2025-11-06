import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  SynthesizerProvider,
  SynthesizerModel,
  SynthesizerVoice,
  TtsConfig,
} from "./entities";
import { SynthesizerController } from "./synthesizer.controller";
import { SynthesizerService } from "./synthesizer.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SynthesizerProvider,
      SynthesizerModel,
      SynthesizerVoice,
      TtsConfig,
    ]),
  ],
  providers: [SynthesizerService],
  controllers: [SynthesizerController],
  exports: [TypeOrmModule, SynthesizerService],
})
export class SynthesizerModule {}
