import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegisteredNumber } from './entities/registered-number.entity';
import { CreateRegisteredNumberDto } from './dto/create-registered-number.dto';
import { UpdateRegisteredNumberDto } from './dto/update-registered-number.dto';

@Injectable()
export class RegisteredNumbersService {
  private readonly logger = new Logger(RegisteredNumbersService.name);

  constructor(
    @InjectRepository(RegisteredNumber)
    private readonly registeredNumberRepository: Repository<RegisteredNumber>,
  ) {}

  async create(
    userId: string,
    createRegisteredNumberDto: CreateRegisteredNumberDto,
  ): Promise<RegisteredNumber> {
    this.logger.log(`Creating new registered number for user: ${userId}`);

    const registeredNumber = this.registeredNumberRepository.create({
      ...createRegisteredNumberDto,
      userId,
    });

    const savedNumber = await this.registeredNumberRepository.save(registeredNumber);
    this.logger.log(`Registered number created successfully with ID: ${savedNumber.id}`);

    return savedNumber;
  }

  async findAllByUser(userId: string): Promise<RegisteredNumber[]> {
    this.logger.log(`Finding all registered numbers for user: ${userId}`);

    return this.registeredNumberRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<RegisteredNumber> {
    const registeredNumber = await this.registeredNumberRepository.findOne({
      where: { id, userId },
    });

    if (!registeredNumber) {
      throw new NotFoundException('Registered number not found');
    }

    return registeredNumber;
  }

  async update(
    id: string,
    userId: string,
    updateRegisteredNumberDto: UpdateRegisteredNumberDto,
  ): Promise<RegisteredNumber> {
    this.logger.log(`Updating registered number with ID: ${id} for user: ${userId}`);

    const registeredNumber = await this.findOne(id, userId);

    Object.assign(registeredNumber, updateRegisteredNumberDto);
    const updatedNumber = await this.registeredNumberRepository.save(registeredNumber);

    this.logger.log(`Registered number updated successfully with ID: ${id}`);
    return updatedNumber;
  }

  async remove(id: string, userId: string): Promise<void> {
    this.logger.log(`Deleting registered number with ID: ${id} for user: ${userId}`);

    const registeredNumber = await this.findOne(id, userId);
    await this.registeredNumberRepository.remove(registeredNumber);

    this.logger.log(`Registered number deleted successfully with ID: ${id}`);
  }
}
