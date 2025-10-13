import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CallLog } from './entities/call-log.entity';

@Injectable()
export class CallLogsService {
  constructor(
    @InjectRepository(CallLog)
    private callLogRepo: Repository<CallLog>,
  ) {}

  async findAll(): Promise<CallLog[]> {
    return this.callLogRepo.find({
      relations: ['assistant'],
      order: { startTime: 'DESC' }
    });
  }

  async findOne(id: string): Promise<CallLog> {
    return this.callLogRepo.findOneBy({ id });
  }

  async create(log: Partial<CallLog>): Promise<CallLog> {
    const newLog = this.callLogRepo.create(log);
    return this.callLogRepo.save(newLog);
  }

  async update(id: string, log: Partial<CallLog>): Promise<CallLog> {
    await this.callLogRepo.update(id, log);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.callLogRepo.delete(id);
  }
}
