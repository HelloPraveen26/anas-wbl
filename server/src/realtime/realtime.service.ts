import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RealtimeProvider, RealtimeModel, RealtimeConfig } from "./entities";

@Injectable()
export class RealtimeService {
  constructor(
    @InjectRepository(RealtimeProvider)
    private realtimeProviderRepository: Repository<RealtimeProvider>,
    @InjectRepository(RealtimeModel)
    private realtimeModelRepository: Repository<RealtimeModel>,
    @InjectRepository(RealtimeConfig)
    private realtimeConfigRepository: Repository<RealtimeConfig>,
  ) {}

  async findAllProviders() {
    return this.realtimeProviderRepository.find({
      where: { isActive: true },
      order: { name: "ASC" },
    });
  }

  async findAllModels(providerId?: string) {
    const whereCondition: any = { isActive: true };

    if (providerId) {
      whereCondition.realtimeProvider = { id: providerId };
    }

    return this.realtimeModelRepository.find({
      where: whereCondition,
      relations: ["realtimeProvider"],
      order: { name: "ASC" },
    });
  }

  async findAllConfigs(providerId?: string) {
    const whereCondition: any = { active: true };

    if (providerId) {
      whereCondition.realtimeProvider = { id: providerId };
    }

    return this.realtimeConfigRepository.find({
      where: whereCondition,
      relations: ["realtimeProvider"],
      order: { label: "ASC" },
    });
  }

  async findProviderById(id: string) {
    return this.realtimeProviderRepository.findOne({
      where: { id, isActive: true },
    });
  }

  async findModelById(id: string) {
    return this.realtimeModelRepository.findOne({
      where: { id, isActive: true },
      relations: ["realtimeProvider"],
    });
  }

  async findConfigById(id: string) {
    return this.realtimeConfigRepository.findOne({
      where: { id, active: true },
      relations: ["realtimeProvider"],
    });
  }
}
