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
import { Assistant } from "../assistant/entities/assistant.entity";
import { CreateRegisteredNumberDto } from "./dto/create-registered-number.dto";
import { UpdateRegisteredNumberDto } from "./dto/update-registered-number.dto";
import { ImportTwilioNumbersDto } from "./dto/import-twilio-numbers.dto";
import { ImportTwilioResponseDto } from "./dto/import-twilio-response.dto";
import { ImportPlivoNumbersDto } from "./dto/import-plivo-numbers.dto";
import { ImportPlivoResponseDto } from "./dto/import-plivo-response.dto";
import { ImportTelecmiNumbersDto } from "./dto/import-telecmi-numbers.dto";
import { ImportTelecmiResponseDto } from "./dto/import-telecmi-response.dto";
import { DispatchRuleResponseDto } from "./dto/dispatch-rule-response.dto";
import { CreateDispatchRuleDto } from "./dto/create-dispatch-rule.dto";
import { CreateDispatchRuleResponseDto } from "./dto/create-dispatch-rule-response.dto";

@Injectable()
export class RegisteredNumbersService {
  private readonly logger = new Logger(RegisteredNumbersService.name);

  constructor(
    @InjectRepository(RegisteredNumber)
    private readonly registeredNumberRepository: Repository<RegisteredNumber>,
    @InjectRepository(Assistant)
    private readonly assistantRepository: Repository<Assistant>,
    private readonly configService: ConfigService,
  ) { }

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

    const {
      phoneNumber,
      address,
      authUsername,
      authPassword,
      inboundEnabled,
      outboundEnabled,
    } = importDto;
    const LIVEKIT_API_KEY = this.configService.get<string>("LIVEKIT_API_KEY");
    const LIVEKIT_API_SECRET =
      this.configService.get<string>("LIVEKIT_API_SECRET");
    const LIVEKIT_URL = this.configService.get<string>("LIVEKIT_URL");

    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
      throw new BadRequestException("LiveKit configuration is missing");
    }

    // Validate that at least one direction is enabled
    if (!inboundEnabled && !outboundEnabled) {
      throw new BadRequestException(
        "At least one of inbound or outbound must be enabled",
      );
    }

    this.logger.log(
      `Twilio import configuration - Inbound: ${inboundEnabled}, Outbound: ${outboundEnabled}`,
    );

    try {
      const sipClient = new SipClient(
        LIVEKIT_URL,
        LIVEKIT_API_KEY,
        LIVEKIT_API_SECRET,
      );
      if (!phoneNumber) {
        this.logger.warn("No phone number provided for Twilio import");
        return {
          importedCount: 0,
          importedNumbers: [],
          message: "No phone number provided for import",
        };
      }

      const importedNumbers = [];

      let outboundTrunkId: string | null = null;
      let inboundTrunkId: string | null = null;

      // Create outbound SIP trunk if enabled
      if (outboundEnabled) {
        const trunkOptions = {
          transport: SIPTransport.SIP_TRANSPORT_AUTO,
          auth_username: authUsername,
          auth_password: authPassword,
        };

        const outboundTrunk = await sipClient.createSipOutboundTrunk(
          `Twilio Trunk ${new Date().toISOString()}`,
          address,
          [phoneNumber],
          trunkOptions,
        );

        outboundTrunkId = outboundTrunk.sipTrunkId;

        this.logger.log(
          `Created LiveKit SIP outbound trunk with ID: ${outboundTrunkId} for phone number: ${phoneNumber}`,
        );
      } else {
        this.logger.log(
          `Skipping outbound trunk creation (outbound disabled) for phone number: ${phoneNumber}`,
        );
      }

      // Create inbound SIP trunk if enabled
      if (inboundEnabled) {
        inboundTrunkId = await this.createSipInboundTrunk(
          [phoneNumber],
          "twilio",
        );

        this.logger.log(
          `Created LiveKit SIP inbound trunk with ID: ${inboundTrunkId} for phone number: ${phoneNumber}`,
        );
      } else {
        this.logger.log(
          `Skipping inbound trunk creation (inbound disabled) for phone number: ${phoneNumber}`,
        );
      }

      // Import the phone number
      const friendlyName = phoneNumber; // Use phone number as friendlyName

      const registeredNumber = this.registeredNumberRepository.create({
        providerName: "twilio",
        friendlyName: friendlyName,
        phoneNo: phoneNumber,
        livekitOutboundTrunkId: outboundTrunkId,
        livekitInboundTrunkId: inboundTrunkId,
        username: authUsername,
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

    const {
      phoneNumber,
      address,
      authUsername,
      authPassword,
      inboundEnabled,
      outboundEnabled,
    } = importDto;
    const LIVEKIT_API_KEY = this.configService.get<string>("LIVEKIT_API_KEY");
    const LIVEKIT_API_SECRET =
      this.configService.get<string>("LIVEKIT_API_SECRET");
    const LIVEKIT_URL = this.configService.get<string>("LIVEKIT_URL");

    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
      throw new BadRequestException("LiveKit configuration is missing");
    }

    // Validate that at least one direction is enabled
    if (!inboundEnabled && !outboundEnabled) {
      throw new BadRequestException(
        "At least one of inbound or outbound must be enabled",
      );
    }

    this.logger.log(
      `Plivo import configuration - Inbound: ${inboundEnabled}, Outbound: ${outboundEnabled}`,
    );

    try {
      const sipClient = new SipClient(
        LIVEKIT_URL,
        LIVEKIT_API_KEY,
        LIVEKIT_API_SECRET,
      );

      if (!phoneNumber) {
        this.logger.warn("No phone number provided for Plivo import");
        return {
          importedCount: 0,
          livekitOutboundTrunkId: "",
          importedNumbers: [],
          message: "No phone number provided for import",
        };
      }

      const importedNumbers = [];

      let outboundTrunkId: string | null = null;
      let inboundTrunkId: string | null = null;

      // Create outbound SIP trunk if enabled
      if (outboundEnabled) {
        const trunkOptions = {
          transport: SIPTransport.SIP_TRANSPORT_AUTO,
          auth_username: authUsername,
          auth_password: authPassword,
        };

        const outboundTrunk = await sipClient.createSipOutboundTrunk(
          `Plivo Trunk ${new Date().toISOString()}`,
          address,
          [phoneNumber],
          trunkOptions,
        );

        outboundTrunkId = outboundTrunk.sipTrunkId;

        this.logger.log(
          `Created LiveKit SIP outbound trunk with ID: ${outboundTrunkId} for phone number: ${phoneNumber}`,
        );
      } else {
        this.logger.log(
          `Skipping outbound trunk creation (outbound disabled) for phone number: ${phoneNumber}`,
        );
      }

      // Create inbound SIP trunk if enabled
      if (inboundEnabled) {
        inboundTrunkId = await this.createSipInboundTrunk(
          [phoneNumber],
          "plivo",
        );

        this.logger.log(
          `Created LiveKit SIP inbound trunk with ID: ${inboundTrunkId} for phone number: ${phoneNumber}`,
        );
      } else {
        this.logger.log(
          `Skipping inbound trunk creation (inbound disabled) for phone number: ${phoneNumber}`,
        );
      }

      // Import the phone number
      const friendlyName = phoneNumber; // Use phone number as friendlyName

      const registeredNumber = this.registeredNumberRepository.create({
        providerName: "plivo",
        friendlyName: friendlyName,
        phoneNo: phoneNumber,
        livekitOutboundTrunkId: outboundTrunkId,
        livekitInboundTrunkId: inboundTrunkId,
        username: authUsername,
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

      const plivoResponse: ImportPlivoResponseDto = {
        importedCount: importedNumbers.length,
        livekitOutboundTrunkId: outboundTrunkId || "",
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

    const {
      phoneNumber,
      address,
      authUsername,
      authPassword,
      inboundEnabled,
      outboundEnabled,
    } = importDto;
    const LIVEKIT_API_KEY = this.configService.get<string>("LIVEKIT_API_KEY");
    const LIVEKIT_API_SECRET =
      this.configService.get<string>("LIVEKIT_API_SECRET");
    const LIVEKIT_URL = this.configService.get<string>("LIVEKIT_URL");

    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
      throw new BadRequestException("LiveKit configuration is missing");
    }

    // Validate that at least one direction is enabled
    if (!inboundEnabled && !outboundEnabled) {
      throw new BadRequestException(
        "At least one of inbound or outbound must be enabled",
      );
    }

    this.logger.log(
      `Telecmi import configuration - Inbound: ${inboundEnabled}, Outbound: ${outboundEnabled}`,
    );

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

      let outboundTrunkId: string | null = null;
      let inboundTrunkId: string | null = null;

      // Create outbound SIP trunk if enabled
      if (outboundEnabled) {
        const trunkOptions = {
          transport: SIPTransport.SIP_TRANSPORT_AUTO,
          auth_username: authUsername,
          auth_password: authPassword,
        };

        const outboundTrunk = await sipClient.createSipOutboundTrunk(
          `Telecmi Trunk ${new Date().toISOString()}`,
          address,
          [phoneNumber],
          trunkOptions,
        );

        outboundTrunkId = outboundTrunk.sipTrunkId;

        this.logger.log(
          `Created LiveKit SIP outbound trunk with ID: ${outboundTrunkId} for phone number: ${phoneNumber}`,
        );
      } else {
        this.logger.log(
          `Skipping outbound trunk creation (outbound disabled) for phone number: ${phoneNumber}`,
        );
      }

      // Create inbound SIP trunk if enabled
      if (inboundEnabled) {
        inboundTrunkId = await this.createSipInboundTrunk(
          [phoneNumber],
          "telecmi",
        );

        this.logger.log(
          `Created LiveKit SIP inbound trunk with ID: ${inboundTrunkId} for phone number: ${phoneNumber}`,
        );
      } else {
        this.logger.log(
          `Skipping inbound trunk creation (inbound disabled) for phone number: ${phoneNumber}`,
        );
      }

      // Import the phone number
      const friendlyName = phoneNumber; // Use phone number as friendlyName

      const registeredNumber = this.registeredNumberRepository.create({
        providerName: "telecmi",
        friendlyName: friendlyName,
        phoneNo: phoneNumber,
        livekitOutboundTrunkId: outboundTrunkId,
        livekitInboundTrunkId: inboundTrunkId,
        username: authUsername,
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
        livekitOutboundTrunkId: outboundTrunkId || "",
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

      // 🛠️ DIRECT API CALL WORKAROUND
      // The livekit-server-sdk v2.13.1 lacks inboundNumbers support in createSipDispatchRule options.
      // We call the Twirp API directly to include this critical filter.
      const url = new URL(
        "/twirp/livekit.SIP/CreateSIPDispatchRule",
        LIVEKIT_URL.replace("wss://", "https://").replace("ws://", "http://"),
      );

      const dispatch_metadata = {
        assistant_id: assistantId,
        phone_number: phoneNumber,
        call_type: "inbound",
      };

      // Construct raw request body according to protocol
      const body = {
        rule: {
          dispatchRuleIndividual: {
            roomPrefix: "call-",
            pin: "",
          },
        },
        trunkIds: [trunkId],
        inboundNumbers: [phoneNumber], // ✅ CRITICAL: This allows multiple rules on one trunk
        name: `${assistantId}-${phoneNumber}`,
        roomConfig: {
          agents: [
            {
              agentName: "inbound-agent", // ✅ Fixed name
              metadata: JSON.stringify(dispatch_metadata),
            },
          ],
        },
      };

      // Generate Auth Header
      const { AccessToken } = await import("livekit-server-sdk");
      const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
        ttl: "10m",
      });
      at.addSIPGrant({ admin: true });
      const authHeader = `Bearer ${await at.toJwt()}`;

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ msg: "Unknown" }));
        throw new Error(err.msg || response.statusText);
      }

      const result = await response.json();
      this.logger.log(
        "Created dispatch rule successfully via direct API",
        JSON.stringify(result, null, 2),
      );

      return result.sipDispatchRuleId;
    } catch (error) {
      this.logger.error(
        `Error creating SIP dispatch rule: ${error.message}`,
        error.stack,
      );

      throw new BadRequestException(
        `Failed to create SIP dispatch rule: ${error.message}`,
      );
    }
  }

  async createDispatchRule(
    userId: string,
    createDispatchRuleDto: CreateDispatchRuleDto,
  ): Promise<CreateDispatchRuleResponseDto> {
    const { assistantId, phoneNumber, trunkId } = createDispatchRuleDto;

    this.logger.log(
      `Creating dispatch rule for user: ${userId}, assistant: ${assistantId}, phone: ${phoneNumber}, trunk: ${trunkId}`,
    );

    // Validate that the trunkId belongs to the user
    const registeredNumber = await this.registeredNumberRepository.findOne({
      where: [
        { userId, livekitInboundTrunkId: trunkId },
        { userId, livekitOutboundTrunkId: trunkId },
      ],
    });

    if (!registeredNumber) {
      throw new BadRequestException(
        "Invalid trunk ID. The trunk does not belong to this user or does not exist.",
      );
    }

    this.logger.log(
      `Trunk validation successful for user ${userId}, trunk ${trunkId}`,
    );

    // Call the existing createSipDispatchRule method
    const sipDispatchRuleId = await this.createSipDispatchRule(
      assistantId,
      phoneNumber,
      trunkId,
    );

    return new CreateDispatchRuleResponseDto(sipDispatchRuleId);
  }

  async getDispatchRules(userId: string): Promise<DispatchRuleResponseDto[]> {
    try {
      // Get all registered numbers for the user
      const registeredNumbers = await this.findAllByUser(userId);

      // Filter for numbers with inbound trunk IDs
      const inboundTrunkIds = registeredNumbers
        .filter((number) => number.livekitInboundTrunkId)
        .map((number) => number.livekitInboundTrunkId);

      if (inboundTrunkIds.length === 0) {
        return [];
      }

      // Initialize LiveKit SIP client
      const LIVEKIT_API_KEY = this.configService.get<string>("LIVEKIT_API_KEY");
      const LIVEKIT_API_SECRET =
        this.configService.get<string>("LIVEKIT_API_SECRET");
      const LIVEKIT_URL = this.configService.get<string>("LIVEKIT_URL");

      if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
        throw new BadRequestException(
          "LiveKit credentials are not configured properly",
        );
      }

      const sipClient = new SipClient(
        LIVEKIT_URL,
        LIVEKIT_API_KEY,
        LIVEKIT_API_SECRET,
      );

      // Get dispatch rules for all trunk IDs
      const rules = await sipClient.listSipDispatchRule({
        trunkIds: inboundTrunkIds,
      });

      // Map the rules to the response DTO
      const dispatchRules: DispatchRuleResponseDto[] = [];

      for (const rule of rules) {
        try {
          // Parse the metadata from the first agent if available
          let assistantId = "";
          let assistantName = "";
          let phoneNumber = "";

          if (rule.roomConfig?.agents && rule.roomConfig.agents.length > 0) {
            const agent = rule.roomConfig.agents[0];
            // Fetch assistant name from database using assistant_id

            // Parse metadata JSON
            if (agent.metadata) {
              try {
                const metadata = JSON.parse(agent.metadata);
                assistantId = metadata.assistant_id || "";
                phoneNumber = metadata.phone_number || "";

                // Fetch assistant from database to get the name
                if (assistantId) {
                  const assistant = await this.assistantRepository.findOne({
                    where: { id: assistantId },
                  });
                  if (assistant) {
                    assistantName = assistant.name;
                  }
                }
              } catch (parseError) {
                this.logger.warn(
                  `Failed to parse agent metadata for rule ${rule.sipDispatchRuleId}: ${parseError.message}`,
                );
              }
            }
          }

          dispatchRules.push(
            new DispatchRuleResponseDto(
              rule.sipDispatchRuleId,
              rule.name,
              assistantId,
              assistantName,
              phoneNumber,
            ),
          );
        } catch (error) {
          this.logger.warn(
            `Failed to process dispatch rule ${rule.sipDispatchRuleId}: ${error.message}`,
          );
          // Continue processing other rules
        }
      }

      return dispatchRules;
    } catch (error) {
      this.logger.error(
        `Failed to get dispatch rules for user ${userId}`,
        error.stack,
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        `Failed to get dispatch rules: ${error.message}`,
      );
    }
  }

  async deleteDispatchRule(
    sipDispatchRuleId: string,
    userId: string,
  ): Promise<void> {
    try {
      // Initialize LiveKit SIP client
      const LIVEKIT_API_KEY = this.configService.get<string>("LIVEKIT_API_KEY");
      const LIVEKIT_API_SECRET =
        this.configService.get<string>("LIVEKIT_API_SECRET");
      const LIVEKIT_URL = this.configService.get<string>("LIVEKIT_URL");

      if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
        throw new BadRequestException(
          "LiveKit credentials are not configured properly",
        );
      }

      const sipClient = new SipClient(
        LIVEKIT_URL,
        LIVEKIT_API_KEY,
        LIVEKIT_API_SECRET,
      );

      // Delete the dispatch rule
      await sipClient.deleteSipDispatchRule(sipDispatchRuleId);

      this.logger.log(
        `Deleted dispatch rule ${sipDispatchRuleId} for user ${userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to delete dispatch rule ${sipDispatchRuleId}: ${error.message}`,
        error.stack,
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        `Failed to delete dispatch rule: ${error.message}`,
      );
    }
  }
}
