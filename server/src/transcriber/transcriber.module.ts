import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TranscriberProvider, TranscriberModel, SttConfig } from "./entities";
import { TranscriberController } from "./transcriber.controller";
import { TranscriberService } from "./transcriber.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TranscriberProvider,
      TranscriberModel,
      SttConfig,
    ]),
  ],
  providers: [TranscriberService],
  controllers: [TranscriberController],
  exports: [TypeOrmModule, TranscriberService],
})
export class TranscriberModule {}
