import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegisteredNumbersService } from './registered-numbers.service';
import { RegisteredNumbersController } from './registered-numbers.controller';
import { RegisteredNumber } from './entities/registered-number.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RegisteredNumber])],
  controllers: [RegisteredNumbersController],
  providers: [RegisteredNumbersService],
  exports: [RegisteredNumbersService],
})
export class RegisteredNumbersModule {}
