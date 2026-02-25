import { Controller } from '@nestjs/common';
import { ChatLogsService } from './chat-logs.service';

@Controller('chat-logs')
export class ChatLogsController {
  constructor(private readonly chatLogsService: ChatLogsService) {}

  // API endpoints will be implemented in the future
}
