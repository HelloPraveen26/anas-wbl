import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LlmProvider, LlmModel } from './entities';

@Injectable()
export class LlmService {
  constructor(
    @InjectRepository(LlmProvider)
    private llmProviderRepository: Repository<LlmProvider>,
    @InjectRepository(LlmModel)
    private llmModelRepository: Repository<LlmModel>,
  ) {}

  async findAllProviders() {
    return this.llmProviderRepository.find({
      where: { isActive: true },
      select: ['id', 'name', 'isActive'],
      order: { name: 'ASC' },
    });
  }

  async findAllModels(providerId?: string) {
    const whereCondition: any = { isActive: true };

    if (providerId) {
      whereCondition.llmProvider = { id: providerId };
    }

    return this.llmModelRepository.find({
      where: whereCondition,
      relations: ['llmProvider'],
      select: {
        id: true,
        name: true,
        isActive: true,
        llmProvider: {
          id: true,
          name: true,
        },
      },
      order: { name: 'ASC' },
    });
  }

  async findModelById(id: string): Promise<LlmModel | null> {
    return this.llmModelRepository.findOne({
      where: { id, isActive: true },
      relations: ['llmProvider'],
    });
  }

  async findProviderById(id: string): Promise<LlmProvider | null> {
    return this.llmProviderRepository.findOne({
      where: { id, isActive: true },
    });
  }
}
