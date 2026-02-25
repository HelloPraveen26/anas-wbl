import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ChatLog } from "./entities/chat-log.entity";
import { CreateChatLogDto } from "./dto/create-chat-log.dto";
import { ChatLogsQueryDto } from "./dto/chat-logs-query.dto";

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

  async findByUserWithPagination(
    userId: string,
    query: ChatLogsQueryDto,
  ): Promise<{ data: ChatLog[]; total: number }> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.chatLogsRepository
      .createQueryBuilder("chatLog")
      .leftJoinAndSelect("chatLog.callLog", "callLog")
      .leftJoinAndSelect("callLog.assistant", "assistant")
      .where("callLog.userId = :userId", { userId });

    // Order by creation date (newest first)
    queryBuilder.orderBy("chatLog.createdAt", "DESC");

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }
}
