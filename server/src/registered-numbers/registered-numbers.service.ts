import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { Repository } from "typeorm";
import { SipClient } from "livekit-server-sdk";
import { SIPTransport } from "@livekit/protocol";
import * as twilio from "twilio";
import { RegisteredNumber } from "./entities/registered-number.entity";
import { CreateRegisteredNumberDto } from "./dto/create-registered-number.dto";
import { UpdateRegisteredNumberDto } from "./dto/update-registered-number.dto";
import { ImportTwilioNumbersDto } from "./dto/import-twilio-numbers.dto";
import { ImportTwilioResponseDto } from "./dto/import-twilio-response.dto";

@Injectable()
export class RegisteredNumbersService {
  private readonly logger = new Logger(RegisteredNumbersService.name);

  constructor(
    @InjectRepository(RegisteredNumber)
    private readonly registeredNumberRepository: Repository<RegisteredNumber>,
    private readonly configService: ConfigService,
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

    const savedNumber =
      await this.registeredNumberRepository.save(registeredNumber);
    this.logger.log(
      `Registered number created successfully with ID: ${savedNumber.id}`,
    );

    return savedNumber;
  }

  async findAllByUser(userId: string): Promise<RegisteredNumber[]> {
    this.logger.log(`Finding all registered numbers for user: ${userId}`);

    return this.registeredNumberRepository.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });
  }

  async findOne(id: string, userId: string): Promise<RegisteredNumber> {
    const registeredNumber = await this.registeredNumberRepository.findOne({
      where: { id, userId },
    });

    if (!registeredNumber) {
      throw new NotFoundException("Registered number not found");
    }

    return registeredNumber;
  }

  async update(
    id: string,
    userId: string,
    updateRegisteredNumberDto: UpdateRegisteredNumberDto,
  ): Promise<RegisteredNumber> {
    this.logger.log(
      `Updating registered number with ID: ${id} for user: ${userId}`,
    );

    const registeredNumber = await this.findOne(id, userId);

    Object.assign(registeredNumber, updateRegisteredNumberDto);
    const updatedNumber =
      await this.registeredNumberRepository.save(registeredNumber);

    this.logger.log(`Registered number updated successfully with ID: ${id}`);
    return updatedNumber;
  }

  async remove(id: string, userId: string): Promise<void> {
    this.logger.log(
      `Deleting registered number with ID: ${id} for user: ${userId}`,
    );

    const registeredNumber = await this.findOne(id, userId);
    await this.registeredNumberRepository.remove(registeredNumber);

    this.logger.log(`Registered number deleted successfully with ID: ${id}`);
  }

  async importTwilioNumbers(
    userId: string,
    importDto: ImportTwilioNumbersDto,
  ): Promise<ImportTwilioResponseDto> {
    this.logger.log(`Starting Twilio number import for user: ${userId}`);

    const { accountSid, authToken, address, authUsername, authPassword } =
      importDto;
    const LIVEKIT_API_KEY = this.configService.get<string>("LIVEKIT_API_KEY");
    const LIVEKIT_API_SECRET =
      this.configService.get<string>("LIVEKIT_API_SECRET");
    const LIVEKIT_URL = this.configService.get<string>("LIVEKIT_URL");

    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
      throw new BadRequestException("LiveKit configuration is missing");
    }

    try {
      const sipClient = new SipClient(
        LIVEKIT_URL,
        LIVEKIT_API_KEY,
        LIVEKIT_API_SECRET,
      );
      const client = twilio(accountSid, authToken);
      const numbers = await client.incomingPhoneNumbers.list({ limit: 20 });
      if (numbers.length === 0) {
        this.logger.warn("No phone numbers found in Twilio account");
        return {
          importedCount: 0,
          importedNumbers: [],
          message: "No phone numbers found in Twilio account to import",
        };
      }
      const importedNumbers = [];
      const trunkOptions = {
        transport: SIPTransport.SIP_TRANSPORT_AUTO,
        auth_username: authUsername,
        auth_password: authPassword,
      };
      for (const number of numbers) {
        let trunk = await sipClient.createSipOutboundTrunk(
          `Twilio Trunk ${new Date().toISOString()}`,
          address,
          [number.phoneNumber], //TODO: pass all numbers into array
          trunkOptions,
        );
        this.logger.log(
          `Created LiveKit SIP trunk with ID: ${trunk.sipTrunkId} for ${number.phoneNumber}`,
        );
        const registeredNumber = this.registeredNumberRepository.create({
          providerName: "twilio",
          friendlyName: number.friendlyName || number.phoneNumber,
          phoneNo: number.phoneNumber,
          livekitOutboundTrunkId: trunk.sipTrunkId,
          active: true,
          userId,
        });

        const savedNumber =
          await this.registeredNumberRepository.save(registeredNumber);

        importedNumbers.push({
          phoneNumber: number.phoneNumber,
          friendlyName: number.friendlyName || number.phoneNumber,
          registeredNumberId: savedNumber.id,
        });
        this.logger.log(`Imported phone number: ${number.phoneNumber}`);
      }

      const response: ImportTwilioResponseDto = {
        importedCount: importedNumbers.length,
        importedNumbers,
        message: `Successfully imported ${importedNumbers.length} phone numbers from Twilio`,
      };

      this.logger.log(
        `Twilio import completed successfully. Imported ${importedNumbers.length} numbers`,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Error importing Twilio numbers: ${error.message}`,
        error.stack,
      );

      if (error.code === 20003) {
        throw new BadRequestException("Invalid Twilio credentials");
      }

      if (error.message.includes("LiveKit")) {
        throw new BadRequestException(`LiveKit error: ${error.message}`);
      }

      throw new BadRequestException(
        `Failed to import Twilio numbers: ${error.message}`,
      );
    }
  }
}
