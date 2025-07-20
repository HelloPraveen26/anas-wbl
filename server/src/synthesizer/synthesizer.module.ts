import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SynthesizerProvider, SynthesizerModel, SynthesizerVoice } from "./entities";

@Module({
  imports: [TypeOrmModule.forFeature([SynthesizerProvider, SynthesizerModel, SynthesizerVoice])],
  providers: [],
  controllers: [],
  exports: [TypeOrmModule],
})
export class SynthesizerModule {}
