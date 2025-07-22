import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assistant } from './entities/assistant.entity';
import { CreateAssistantDto, UpdateAssistantDto, AssistantResponseDto } from './dto';
import { LlmModel } from '../llm/entities/llm-model.entity';
import { TranscriberModel } from '../transcriber/entities/transcriber-model.entity';
import { SynthesizerVoice } from '../synthesizer/entities/synthesizer-voice.entity';

@Injectable()
export class AssistantService {
  constructor(
    @InjectRepository(Assistant)
    private assistantRepository: Repository<Assistant>,
    @InjectRepository(LlmModel)
    private llmModelRepository: Repository<LlmModel>,
    @InjectRepository(TranscriberModel)
    private transcriberModelRepository: Repository<TranscriberModel>,
    @InjectRepository(SynthesizerVoice)
    private synthesizerVoiceRepository: Repository<SynthesizerVoice>,
  ) {}

  async findAll(userId: string): Promise<AssistantResponseDto[]> {
    const assistants = await this.assistantRepository.find({
      where: { user: { id: userId }, isActive: true },
      relations: [
        'llmModel',
        'llmModel.llmProvider',
        'transcriberModel',
        'transcriberModel.transcriberProvider',
        'synthesizerVoice',
        'synthesizerVoice.synthesizerModel',
        'synthesizerVoice.synthesizerModel.synthesizerProvider',
      ],
      order: { createdAt: 'DESC' },
    });

    return assistants.map(assistant => new AssistantResponseDto(assistant));
  }

  async findOne(id: string, userId: string): Promise<AssistantResponseDto> {
    const assistant = await this.assistantRepository.findOne({
      where: { id, user: { id: userId }, isActive: true },
      relations: [
        'llmModel',
        'llmModel.llmProvider',
        'transcriberModel',
        'transcriberModel.transcriberProvider',
        'synthesizerVoice',
        'synthesizerVoice.synthesizerModel',
        'synthesizerVoice.synthesizerModel.synthesizerProvider',
      ],
    });

    if (!assistant) {
      throw new NotFoundException('Assistant not found');
    }

    return new AssistantResponseDto(assistant);
  }

  async create(userId: string, createAssistantDto: CreateAssistantDto): Promise<AssistantResponseDto> {
    // Validate that the referenced models exist and are active
    await this.validateReferences(createAssistantDto);

    const assistant = this.assistantRepository.create({
      ...createAssistantDto,
      user: { id: userId },
      isActive: createAssistantDto.isActive ?? true,
    });

    const savedAssistant = await this.assistantRepository.save(assistant);

    // Fetch the complete assistant with relations
    return this.findOne(savedAssistant.id, userId);
  }

  async update(id: string, userId: string, updateAssistantDto: UpdateAssistantDto): Promise<AssistantResponseDto> {
    const assistant = await this.assistantRepository.findOne({
      where: { id, user: { id: userId }, isActive: true },
    });

    if (!assistant) {
      throw new NotFoundException('Assistant not found');
    }

    // Validate references if they're being updated
    if (updateAssistantDto.llmModelId || updateAssistantDto.transcriberModelId || updateAssistantDto.synthesizerVoiceId) {
      const validationDto = {
        llmModelId: updateAssistantDto.llmModelId || assistant.llmModelId,
        transcriberModelId: updateAssistantDto.transcriberModelId || assistant.transcriberModelId,
        synthesizerVoiceId: updateAssistantDto.synthesizerVoiceId || assistant.synthesizerVoiceId,
      };
      await this.validateReferences(validationDto);
    }

    // Update the assistant
    await this.assistantRepository.update(id, updateAssistantDto);

    // Return updated assistant with relations
    return this.findOne(id, userId);
  }

  async remove(id: string, userId: string): Promise<void> {
    const assistant = await this.assistantRepository.findOne({
      where: { id, user: { id: userId }, isActive: true },
    });

    if (!assistant) {
      throw new NotFoundException('Assistant not found');
    }

    // Soft delete by setting isActive to false
    await this.assistantRepository.update(id, { isActive: false });
  }

  async createDefaultAssistant(userId: string): Promise<AssistantResponseDto> {
    // Get the first available models for default assistant
    const llmModel = await this.llmModelRepository.findOne({
      where: { isActive: true },
      relations: ['llmProvider'],
    });

    const transcriberModel = await this.transcriberModelRepository.findOne({
      where: { isActive: true },
      relations: ['transcriberProvider'],
    });

    const synthesizerVoice = await this.synthesizerVoiceRepository.findOne({
      where: { isActive: true },
      relations: ['synthesizerModel', 'synthesizerModel.synthesizerProvider'],
    });

    if (!llmModel || !transcriberModel || !synthesizerVoice) {
      throw new BadRequestException('Required models not available for default assistant creation');
    }

    const defaultAssistantDto: CreateAssistantDto = {
      name: 'Default Assistant',
      firstMessage: 'Hello! How can I help you today?',
      systemPrompt: 'You are a helpful AI assistant. Be friendly, concise, and helpful in your responses.',
      llmModelId: llmModel.id,
      transcriberModelId: transcriberModel.id,
      synthesizerVoiceId: synthesizerVoice.id,
      isActive: true,
    };

    return this.create(userId, defaultAssistantDto);
  }

  private async validateReferences(dto: { llmModelId: string; transcriberModelId: string; synthesizerVoiceId: string }): Promise<void> {
    // Validate LLM Model
    const llmModel = await this.llmModelRepository.findOne({
      where: { id: dto.llmModelId, isActive: true },
    });
    if (!llmModel) {
      throw new BadRequestException('Invalid LLM model ID');
    }

    // Validate Transcriber Model
    const transcriberModel = await this.transcriberModelRepository.findOne({
      where: { id: dto.transcriberModelId, isActive: true },
    });
    if (!transcriberModel) {
      throw new BadRequestException('Invalid transcriber model ID');
    }

    // Validate Synthesizer Voice
    const synthesizerVoice = await this.synthesizerVoiceRepository.findOne({
      where: { id: dto.synthesizerVoiceId, isActive: true },
    });
    if (!synthesizerVoice) {
      throw new BadRequestException('Invalid synthesizer voice ID');
    }
  }
}
