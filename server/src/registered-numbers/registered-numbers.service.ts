import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { Repository } from "typeorm";
import {
  SipClient,
  SipDispatchRuleIndividual,
  CreateSipDispatchRuleOptions,
} from "livekit-server-sdk";
import {
  SIPTransport,
  RoomConfiguration,
  RoomAgentDispatch,
} from "@livekit/protocol";
import * as twilio from "twilio";
import * as plivo from "plivo";
import { RegisteredNumber } from "./entities/registered-number.entity";
import { CreateRegisteredNumberDto } from "./dto/create-registered-number.dto";
import { UpdateRegisteredNumberDto } from "./dto/update-registered-number.dto";
import { ImportTwilioNumbersDto } from "./dto/import-twilio-numbers.dto";
import { ImportTwilioResponseDto } from "./dto/import-twilio-response.dto";
import { ImportPlivoNumbersDto } from "./dto/import-plivo-numbers.dto";
import { ImportPlivoResponseDto } from "./dto/import-plivo-response.dto";
import { ImportTelecmiNumbersDto } from "./dto/import-telecmi-numbers.dto";
import { ImportTelecmiResponseDto } from "./dto/import-telecmi-response.dto";

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

  async importPlivoNumbers(
    userId: string,
    importDto: ImportPlivoNumbersDto,
  ): Promise<ImportPlivoResponseDto> {
    this.logger.log(`Starting Plivo number import for user: ${userId}`);

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

      const client = new plivo.Client(accountSid, authToken);
      const response = await client.numbers.list({ limit: 20 });
      const numbers = response;

      if (numbers.length === 0) {
        this.logger.warn("No phone numbers found in Plivo account");
        return {
          importedCount: 0,
          livekitOutboundTrunkId: "",
          importedNumbers: [],
          message: "No phone numbers found in Plivo account to import",
        };
      }

      const importedNumbers = [];
      const phoneNumbers = numbers.map((number) => `+${number.number}`);

      // Create a single SIP trunk for all numbers
      const trunkOptions = {
        transport: SIPTransport.SIP_TRANSPORT_AUTO,
        auth_username: authUsername,
        auth_password: authPassword,
      };

      const trunk = await sipClient.createSipOutboundTrunk(
        `Plivo Trunk ${new Date().toISOString()}`,
        address,
        phoneNumbers,
        trunkOptions,
      );

      this.logger.log(
        `Created LiveKit SIP trunk with ID: ${trunk.sipTrunkId} for ${phoneNumbers.length} numbers`,
      );

      // Import each number
      for (const number of numbers) {
        const phoneNumber = `+${number.number}`;
        const friendlyName = number.number; // Use same number as friendlyName as specified

        const registeredNumber = this.registeredNumberRepository.create({
          providerName: "plivo",
          friendlyName: friendlyName,
          phoneNo: phoneNumber,
          livekitOutboundTrunkId: trunk.sipTrunkId,
          active: true,
          userId,
        });

        const savedNumber =
          await this.registeredNumberRepository.save(registeredNumber);

        importedNumbers.push({
          phoneNumber: phoneNumber,
          friendlyName: friendlyName,
          registeredNumberId: savedNumber.id,
        });

        this.logger.log(`Imported phone number: ${phoneNumber}`);
      }

      const plivoResponse: ImportPlivoResponseDto = {
        importedCount: importedNumbers.length,
        livekitOutboundTrunkId: trunk.sipTrunkId,
        importedNumbers,
        message: `Successfully imported ${importedNumbers.length} phone numbers from Plivo`,
      };

      this.logger.log(
        `Plivo import completed successfully. Imported ${importedNumbers.length} numbers`,
      );
      return plivoResponse;
    } catch (error) {
      this.logger.error(
        `Error importing Plivo numbers: ${error.message}`,
        error.stack,
      );

      if (error.message.includes("Authentication failed")) {
        throw new BadRequestException("Invalid Plivo credentials");
      }

      if (error.message.includes("LiveKit")) {
        throw new BadRequestException(`LiveKit error: ${error.message}`);
      }

      throw new BadRequestException(
        `Failed to import Plivo numbers: ${error.message}`,
      );
    }
  }

  async importTelecmiNumbers(
    userId: string,
    importDto: ImportTelecmiNumbersDto,
  ): Promise<ImportTelecmiResponseDto> {
    this.logger.log(`Starting Telecmi number import for user: ${userId}`);

    const { phoneNumber, address, authUsername, authPassword } = importDto;
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

      if (!phoneNumber) {
        this.logger.warn("No phone number provided for Telecmi import");
        return {
          importedCount: 0,
          livekitOutboundTrunkId: "",
          importedNumbers: [],
          message: "No phone number provided for import",
        };
      }

      const importedNumbers = [];

      // Create a single SIP trunk for all numbers
      const trunkOptions = {
        transport: SIPTransport.SIP_TRANSPORT_AUTO,
        auth_username: authUsername,
        auth_password: authPassword,
      };

      const trunk = await sipClient.createSipOutboundTrunk(
        `Telecmi Trunk ${new Date().toISOString()}`,
        address,
        [phoneNumber],
        trunkOptions,
      );

      this.logger.log(
        `Created LiveKit SIP trunk with ID: ${trunk.sipTrunkId} for phone number: ${phoneNumber}`,
      );

      // Create SIP dispatch rule
      const rule: SipDispatchRuleIndividual = {
        roomPrefix: "call-",
        type: "individual",
      };
      const options: CreateSipDispatchRuleOptions = {
        name: "dispatch rule - telecmi from node",
        trunkIds: [trunk.sipTrunkId],
        roomConfig: new RoomConfiguration({
          agents: [
            new RoomAgentDispatch({
              agentName: "hexite-outbound-caller",
              metadata: "dispatch metadata",
            }),
          ],
        }),
      };

      const dispatchRule = await sipClient.createSipDispatchRule(rule, options);
      this.logger.log(
        "created dispatch rule",
        JSON.stringify(dispatchRule, null, 2),
      );

      // Import the phone number
      const friendlyName = phoneNumber; // Use phone number as friendlyName

      const registeredNumber = this.registeredNumberRepository.create({
        providerName: "telecmi",
        friendlyName: friendlyName,
        phoneNo: phoneNumber,
        livekitOutboundTrunkId: trunk.sipTrunkId,
        active: true,
        userId,
      });

      const savedNumber =
        await this.registeredNumberRepository.save(registeredNumber);

      importedNumbers.push({
        phoneNumber: phoneNumber,
        friendlyName: friendlyName,
        registeredNumberId: savedNumber.id,
      });

      this.logger.log(`Imported phone number: ${phoneNumber}`);

      const telecmiResponse: ImportTelecmiResponseDto = {
        importedCount: importedNumbers.length,
        livekitOutboundTrunkId: trunk.sipTrunkId,
        importedNumbers,
        message: `Successfully imported ${importedNumbers.length} phone numbers from Telecmi`,
      };

      this.logger.log(
        `Telecmi import completed successfully. Imported ${importedNumbers.length} numbers`,
      );
      return telecmiResponse;
    } catch (error) {
      this.logger.error(
        `Error importing Telecmi numbers: ${error.message}`,
        error.stack,
      );

      if (error.message.includes("Authentication failed")) {
        throw new BadRequestException("Invalid Telecmi credentials");
      }

      if (error.message.includes("LiveKit")) {
        throw new BadRequestException(`LiveKit error: ${error.message}`);
      }

      throw new BadRequestException(
        `Failed to import Telecmi numbers: ${error.message}`,
      );
    }
  }

  async createSipInboundTrunk(
    phoneNumbers: string[],
    providerName: string,
  ): Promise<string> {
    this.logger.log(
      `Creating SIP inbound trunk for provider: ${providerName} with numbers: ${phoneNumbers.join(", ")}`,
    );

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

      // Check for existing trunks with the same number(s) and delete them
      this.logger.log(
        "Checking for existing trunks with the same number(s)...",
      );
      const existingTrunks = await sipClient.listSipInboundTrunk();

      for (const existingTrunk of existingTrunks) {
        const hasMatchingNumber = phoneNumbers.some((num) =>
          existingTrunk.numbers.includes(num),
        );

        if (hasMatchingNumber) {
          this.logger.log(
            `Found existing trunk "${existingTrunk.name}" (${existingTrunk.sipTrunkId}) with matching number(s). Deleting...`,
          );
          await sipClient.deleteSipTrunk(existingTrunk.sipTrunkId);
          this.logger.log(`Deleted trunk: ${existingTrunk.sipTrunkId}`);
        }
      }

      // Create trunk name: provider + phone numbers
      const trunkName = `${providerName} | ${phoneNumbers.join(", ")}`;

      // Default trunk options
      const trunkOptions = {
        krispEnabled: true,
      };

      this.logger.log("Creating new inbound trunk...");
      const trunk = await sipClient.createSipInboundTrunk(
        trunkName,
        phoneNumbers,
        trunkOptions,
      );

      this.logger.log(
        `Successfully created inbound trunk with ID: ${trunk.sipTrunkId}`,
      );

      return trunk.sipTrunkId;
    } catch (error) {
      this.logger.error(
        `Error creating SIP inbound trunk: ${error.message}`,
        error.stack,
      );

      if (error.message.includes("LiveKit")) {
        throw new BadRequestException(`LiveKit error: ${error.message}`);
      }

      throw new BadRequestException(
        `Failed to create SIP inbound trunk: ${error.message}`,
      );
    }
  }

  async createSipDispatchRule(
    assistantId: string,
    phoneNumber: string,
    trunkId: string,
  ) {
    this.logger.log(
      `Creating SIP dispatch rule for assistant: ${assistantId}, phone: ${phoneNumber}, trunk: ${trunkId}`,
    );

    try {
      const LIVEKIT_API_KEY = this.configService.get<string>("LIVEKIT_API_KEY");
      const LIVEKIT_API_SECRET =
        this.configService.get<string>("LIVEKIT_API_SECRET");
      const LIVEKIT_URL = this.configService.get<string>("LIVEKIT_URL");

      if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
        throw new BadRequestException(
          "LiveKit configuration is missing. Please check your environment variables.",
        );
      }

      const sipClient = new SipClient(
        LIVEKIT_URL,
        LIVEKIT_API_KEY,
        LIVEKIT_API_SECRET,
      );

      const dispatch_metadata = {
        assistant_id: assistantId,
        phone_number: phoneNumber,
        call_type: "inbound",
      };

      const rule: SipDispatchRuleIndividual = {
        roomPrefix: "call-",
        type: "individual",
      };

      const options: CreateSipDispatchRuleOptions = {
        name: `${assistantId}-${phoneNumber}`,
        trunkIds: [trunkId],
        roomConfig: new RoomConfiguration({
          agents: [
            new RoomAgentDispatch({
              agentName: "hexite-inbound-caller",
              metadata: JSON.stringify(dispatch_metadata),
            }),
          ],
        }),
      };

      const dispatchRule = await sipClient.createSipDispatchRule(rule, options);

      this.logger.log(
        "Created dispatch rule successfully",
        JSON.stringify(dispatchRule, null, 2),
      );

      return dispatchRule.sipDispatchRuleId;
    } catch (error) {
      this.logger.error(
        `Error creating SIP dispatch rule: ${error.message}`,
        error.stack,
      );

      if (error.message.includes("LiveKit")) {
        throw new BadRequestException(`LiveKit error: ${error.message}`);
      }

      throw new BadRequestException(
        `Failed to create SIP dispatch rule: ${error.message}`,
      );
    }
  }
}
