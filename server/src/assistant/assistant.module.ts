import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Assistant } from "./entities";

@Module({
  imports: [TypeOrmModule.forFeature([Assistant])],
  providers: [],
  controllers: [],
  exports: [TypeOrmModule],
})
export class AssistantModule {}
