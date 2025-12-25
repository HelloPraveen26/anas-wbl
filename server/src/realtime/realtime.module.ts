import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RealtimeProvider, RealtimeModel, RealtimeConfig } from "./entities";
import { RealtimeController } from "./realtime.controller";
import { RealtimeService } from "./realtime.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RealtimeProvider,
      RealtimeModel,
      RealtimeConfig,
    ]),
  ],
  providers: [RealtimeService],
  controllers: [RealtimeController],
  exports: [TypeOrmModule, RealtimeService],
})
export class RealtimeModule {}
