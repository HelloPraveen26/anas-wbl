import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CallLog } from "./entities/call-log.entity";
import { CallLogsQueryDto } from "./dto";

@Injectable()
export class CallLogsService {
  constructor(
    @InjectRepository(CallLog)
    private callLogRepo: Repository<CallLog>,
  ) {}

  async findAll(): Promise<CallLog[]> {
    return this.callLogRepo.find({
      relations: ["assistant"],
      order: { createdAt: "DESC" },
    });
  }

  async findOne(id: string): Promise<CallLog> {
    return this.callLogRepo.findOne({
      where: { id },
      relations: ["assistant"],
    });
  }

  async findBySessionId(sessionId: string): Promise<CallLog> {
    return this.callLogRepo.findOne({
      where: { sessionId },
      relations: ["assistant"],
    });
  }

  async findAllByUser(userId: string): Promise<CallLog[]> {
    return this.callLogRepo.find({
      where: { userId },
      relations: ["assistant"],
      order: { createdAt: "DESC" },
    });
  }

  async findByUserWithPagination(
    userId: string,
    query: CallLogsQueryDto,
  ): Promise<{ data: CallLog[]; total: number }> {
    const { page = 1, limit = 50, type, callStatus } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.callLogRepo
      .createQueryBuilder("callLog")
      .leftJoinAndSelect("callLog.assistant", "assistant")
      .where("callLog.userId = :userId", { userId });

    // Apply filters
    if (type) {
      queryBuilder.andWhere("callLog.type = :type", { type });
    }

    if (callStatus) {
      queryBuilder.andWhere("callLog.callStatus = :callStatus", { callStatus });
    }

    // Order by creation date (newest first)
    queryBuilder.orderBy("callLog.createdAt", "DESC");

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }

  async create(log: Partial<CallLog>): Promise<CallLog> {
    const newLog = this.callLogRepo.create(log);
    return this.callLogRepo.save(newLog);
  }

  async update(id: string, log: Partial<CallLog>): Promise<CallLog> {
    await this.callLogRepo.update(id, log);
    return this.findOne(id);
  }

  async updateBySessionId(
    sessionId: string,
    log: Partial<CallLog>,
  ): Promise<CallLog> {
    await this.callLogRepo.update({ sessionId }, log);
    return this.findBySessionId(sessionId);
  }

  async remove(id: string): Promise<void> {
    await this.callLogRepo.delete(id);
  }
}
