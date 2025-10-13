import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CallLogsService } from './call-logs.service';
import { CallLogsController } from './call-logs.controller';
import { CallLog } from './entities/call-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CallLog])],
  providers: [CallLogsService],
  controllers: [CallLogsController],
})
export class CallLogsModule {}
