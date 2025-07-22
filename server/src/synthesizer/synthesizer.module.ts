import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  SynthesizerProvider,
  SynthesizerModel,
  SynthesizerVoice,
} from "./entities";
import { SynthesizerController } from "./synthesizer.controller";
import { SynthesizerService } from "./synthesizer.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SynthesizerProvider,
      SynthesizerModel,
      SynthesizerVoice,
    ]),
  ],
  providers: [SynthesizerService],
  controllers: [SynthesizerController],
  exports: [TypeOrmModule, SynthesizerService],
})
export class SynthesizerModule {}
