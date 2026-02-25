import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ChatLog } from "./entities/chat-log.entity";
import { CreateChatLogDto } from "./dto/create-chat-log.dto";

@Injectable()
export class ChatLogsService {
  constructor(
    @InjectRepository(ChatLog)
    private chatLogsRepository: Repository<ChatLog>,
  ) {}

  async create(createChatLogDto: CreateChatLogDto): Promise<ChatLog> {
    const chatLog = this.chatLogsRepository.create(createChatLogDto);
    return await this.chatLogsRepository.save(chatLog);
  }
}
