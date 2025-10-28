import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { RegisteredNumbersService } from "./registered-numbers.service";
import { RegisteredNumbersController } from "./registered-numbers.controller";
import { RegisteredNumber } from "./entities/registered-number.entity";

@Module({
  imports: [TypeOrmModule.forFeature([RegisteredNumber]), ConfigModule],
  controllers: [RegisteredNumbersController],
  providers: [RegisteredNumbersService],
  exports: [RegisteredNumbersService],
})
export class RegisteredNumbersModule {}
