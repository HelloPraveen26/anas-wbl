import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SynthesizerProvider, SynthesizerModel } from "./entities";

@Injectable()
export class SynthesizerService {
  constructor(
    @InjectRepository(SynthesizerProvider)
    private synthesizerProviderRepository: Repository<SynthesizerProvider>,
    @InjectRepository(SynthesizerModel)
    private synthesizerModelRepository: Repository<SynthesizerModel>,
  ) {}

  async findAllProviders() {
    return this.synthesizerProviderRepository.find({
      where: { isActive: true },
      select: ["id", "name", "isActive"],
      order: { name: "ASC" },
    });
  }

  async findAllModels(providerId?: string) {
    const whereCondition: any = { isActive: true };

    if (providerId) {
      whereCondition.synthesizerProvider = { id: providerId };
    }

    return this.synthesizerModelRepository.find({
      where: whereCondition,
      relations: ["synthesizerProvider"],
      select: {
        id: true,
        name: true,
        isActive: true,
        synthesizerProvider: {
          id: true,
          name: true,
        },
      },
      order: { name: "ASC" },
    });
  }

  async findModelById(id: string): Promise<SynthesizerModel | null> {
    return this.synthesizerModelRepository.findOne({
      where: { id, isActive: true },
      relations: ["synthesizerProvider"],
    });
  }

  async findProviderById(id: string): Promise<SynthesizerProvider | null> {
    return this.synthesizerProviderRepository.findOne({
      where: { id, isActive: true },
    });
  }
}
