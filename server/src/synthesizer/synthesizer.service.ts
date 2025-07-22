import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SynthesizerProvider, SynthesizerModel, SynthesizerVoice } from './entities';

@Injectable()
export class SynthesizerService {
  constructor(
    @InjectRepository(SynthesizerProvider)
    private synthesizerProviderRepository: Repository<SynthesizerProvider>,
    @InjectRepository(SynthesizerModel)
    private synthesizerModelRepository: Repository<SynthesizerModel>,
    @InjectRepository(SynthesizerVoice)
    private synthesizerVoiceRepository: Repository<SynthesizerVoice>,
  ) {}

  async findAllProviders() {
    return this.synthesizerProviderRepository.find({
      where: { isActive: true },
      select: ['id', 'name', 'isActive'],
      order: { name: 'ASC' },
    });
  }

  async findAllModels(providerId?: string) {
    const whereCondition: any = { isActive: true };

    if (providerId) {
      whereCondition.synthesizerProvider = { id: providerId };
    }

    return this.synthesizerModelRepository.find({
      where: whereCondition,
      relations: ['synthesizerProvider'],
      select: {
        id: true,
        name: true,
        isActive: true,
        synthesizerProvider: {
          id: true,
          name: true,
        },
      },
      order: { name: 'ASC' },
    });
  }

  async findAllVoices(modelId?: string, providerId?: string) {
    const whereCondition: any = { isActive: true };

    if (modelId) {
      whereCondition.synthesizerModel = { id: modelId };
    } else if (providerId) {
      whereCondition.synthesizerModel = {
        synthesizerProvider: { id: providerId },
      };
    }

    return this.synthesizerVoiceRepository.find({
      where: whereCondition,
      relations: ['synthesizerModel', 'synthesizerModel.synthesizerProvider'],
      select: {
        id: true,
        name: true,
        isActive: true,
        synthesizerModel: {
          id: true,
          name: true,
          synthesizerProvider: {
            id: true,
            name: true,
          },
        },
      },
      order: { name: 'ASC' },
    });
  }

  async findVoiceById(id: string): Promise<SynthesizerVoice | null> {
    return this.synthesizerVoiceRepository.findOne({
      where: { id, isActive: true },
      relations: ['synthesizerModel', 'synthesizerModel.synthesizerProvider'],
    });
  }

  async findModelById(id: string): Promise<SynthesizerModel | null> {
    return this.synthesizerModelRepository.findOne({
      where: { id, isActive: true },
      relations: ['synthesizerProvider'],
    });
  }

  async findProviderById(id: string): Promise<SynthesizerProvider | null> {
    return this.synthesizerProviderRepository.findOne({
      where: { id, isActive: true },
    });
  }
}
