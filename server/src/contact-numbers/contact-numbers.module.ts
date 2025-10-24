import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ContactNumbersService } from "./contact-numbers.service";
import { ContactNumbersController } from "./contact-numbers.controller";
import { ContactNumber } from "./entities/contact-number.entity";

@Module({
  imports: [TypeOrmModule.forFeature([ContactNumber])],
  controllers: [ContactNumbersController],
  providers: [ContactNumbersService],
  exports: [ContactNumbersService],
})
export class ContactNumbersModule {}
