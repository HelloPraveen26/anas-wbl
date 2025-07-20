import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TranscriberProvider, TranscriberModel } from "./entities";

@Module({
  imports: [TypeOrmModule.forFeature([TranscriberProvider, TranscriberModel])],
  providers: [],
  controllers: [],
  exports: [TypeOrmModule],
})
export class TranscriberModule {}
