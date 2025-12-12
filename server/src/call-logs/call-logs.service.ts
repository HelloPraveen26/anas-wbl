import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CallLog } from "./entities/call-log.entity";

@Injectable()
export class CallLogsService {
  constructor(
    @InjectRepository(CallLog)
    private callLogRepo: Repository<CallLog>,
  ) {}

  async findAll(): Promise<CallLog[]> {
    return this.callLogRepo.find({
      relations: ["assistant", "user"],
      order: { createdAt: "DESC" },
    });
  }

  async findOne(id: string): Promise<CallLog> {
    return this.callLogRepo.findOne({
      where: { id },
      relations: ["assistant", "user"],
    });
  }

  async findBySessionId(sessionId: string): Promise<CallLog> {
    return this.callLogRepo.findOne({
      where: { sessionId },
      relations: ["assistant", "user"],
    });
  }

  async findAllByUser(userId: string): Promise<CallLog[]> {
    return this.callLogRepo.find({
      where: { userId },
      relations: ["assistant", "user"],
      order: { createdAt: "DESC" },
    });
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
