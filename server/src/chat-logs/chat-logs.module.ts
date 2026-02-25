import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatLogsService } from './chat-logs.service';
import { ChatLogsController } from './chat-logs.controller';
import { ChatLog } from './entities/chat-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChatLog])],
  controllers: [ChatLogsController],
  providers: [ChatLogsService],
  exports: [ChatLogsService],
})
export class ChatLogsModule {}
