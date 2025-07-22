import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TranscriberProvider, TranscriberModel } from './entities';

@Injectable()
export class TranscriberService {
  constructor(
    @InjectRepository(TranscriberProvider)
    private transcriberProviderRepository: Repository<TranscriberProvider>,
    @InjectRepository(TranscriberModel)
    private transcriberModelRepository: Repository<TranscriberModel>,
  ) {}

  async findAllProviders() {
    return this.transcriberProviderRepository.find({
      where: { isActive: true },
      select: ['id', 'name', 'isActive'],
      order: { name: 'ASC' },
    });
  }

  async findAllModels(providerId?: string) {
    const whereCondition: any = { isActive: true };

    if (providerId) {
      whereCondition.transcriberProvider = { id: providerId };
    }

    return this.transcriberModelRepository.find({
      where: whereCondition,
      relations: ['transcriberProvider'],
      select: {
        id: true,
        name: true,
        isActive: true,
        transcriberProvider: {
          id: true,
          name: true,
        },
      },
      order: { name: 'ASC' },
    });
  }

  async findModelById(id: string): Promise<TranscriberModel | null> {
    return this.transcriberModelRepository.findOne({
      where: { id, isActive: true },
      relations: ['transcriberProvider'],
    });
  }

  async findProviderById(id: string): Promise<TranscriberProvider | null> {
    return this.transcriberProviderRepository.findOne({
      where: { id, isActive: true },
    });
  }
}
