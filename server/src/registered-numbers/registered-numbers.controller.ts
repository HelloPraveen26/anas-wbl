import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from "@nestjs/swagger";
import { ThrottlerGuard } from "@nestjs/throttler";
import { RegisteredNumbersService } from "./registered-numbers.service";
import { CreateRegisteredNumberDto } from "./dto/create-registered-number.dto";
import { UpdateRegisteredNumberDto } from "./dto/update-registered-number.dto";
import { RegisteredNumberResponseDto } from "./dto/registered-number-response.dto";
import { DispatchRuleResponseDto } from "./dto/dispatch-rule-response.dto";
import { ImportTwilioNumbersDto } from "./dto/import-twilio-numbers.dto";
import { ImportTwilioResponseDto } from "./dto/import-twilio-response.dto";
import { ImportPlivoNumbersDto } from "./dto/import-plivo-numbers.dto";
import { ImportPlivoResponseDto } from "./dto/import-plivo-response.dto";
import { ImportTelecmiNumbersDto } from "./dto/import-telecmi-numbers.dto";
import { ImportTelecmiResponseDto } from "./dto/import-telecmi-response.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("registered-numbers")
@Controller("registered-numbers")
@UseGuards(ThrottlerGuard)
export class RegisteredNumbersController {
  constructor(
    private readonly registeredNumbersService: RegisteredNumbersService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Create a new registered phone number",
    description:
      "Create a new registered phone number for the authenticated user",
  })
  @ApiBody({ type: CreateRegisteredNumberDto })
  @ApiResponse({
    status: 201,
    description: "Registered number created successfully",
    type: RegisteredNumberResponseDto,
    example: {
      id: "uuid-here",
      providerName: "twilio",
      friendlyName: "Balaji k",
      phoneNo: "+19282185402",
      livekitOutboundTrunkId: "ST_xn9xEW6gFR3R",
      active: true,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
  })
  @ApiResponse({ status: 400, description: "Bad request - validation failed" })
  @ApiResponse({ status: 401, description: "Unauthorized - invalid token" })
  async create(
    @Request() req,
    @Body() createRegisteredNumberDto: CreateRegisteredNumberDto,
  ): Promise<RegisteredNumberResponseDto> {
    const registeredNumber = await this.registeredNumbersService.create(
      req.user.id,
      createRegisteredNumberDto,
    );
    return new RegisteredNumberResponseDto(registeredNumber);
  }

  @Post("import-phone-numbers-twilio")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Import phone number for Twilio",
    description:
      "Import a single phone number for Twilio provider and create LiveKit SIP trunks (inbound/outbound) based on configuration",
  })
  @ApiBody({ type: ImportTwilioNumbersDto })
  @ApiResponse({
    status: 201,
    description: "Phone numbers imported successfully",
    type: ImportTwilioResponseDto,
    example: {
      importedCount: 1,
      importedNumbers: [
        {
          phoneNumber: "+19282185402",
          friendlyName: "+19282185402",
          registeredNumberId: "uuid-here",
        },
      ],
      message: "Successfully imported 1 phone numbers from Twilio",
    },
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - validation failed or Twilio/LiveKit error",
  })
  @ApiResponse({ status: 401, description: "Unauthorized - invalid token" })
  async importTwilioNumbers(
    @Request() req,
    @Body() importTwilioNumbersDto: ImportTwilioNumbersDto,
  ): Promise<ImportTwilioResponseDto> {
    return this.registeredNumbersService.importTwilioNumbers(
      req.user.id,
      importTwilioNumbersDto,
    );
  }

  @Post("import-phone-numbers-plivo")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Import phone numbers from Plivo",
    description:
      "Import phone numbers from Plivo account and create LiveKit SIP trunk",
  })
  @ApiBody({ type: ImportPlivoNumbersDto })
  @ApiResponse({
    status: 201,
    description: "Phone numbers imported successfully",
    type: ImportPlivoResponseDto,
    example: {
      importedCount: 3,
      livekitOutboundTrunkId: "ST_YTGYHbEZ8PWm",
      importedNumbers: [
        {
          phoneNumber: "+918035316457",
          friendlyName: "918035316457",
          registeredNumberId: "uuid-here",
        },
      ],
      message: "Successfully imported 3 phone numbers from Plivo",
    },
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - validation failed or Plivo/LiveKit error",
  })
  @ApiResponse({ status: 401, description: "Unauthorized - invalid token" })
  async importPlivoNumbers(
    @Request() req,
    @Body() importPlivoNumbersDto: ImportPlivoNumbersDto,
  ): Promise<ImportPlivoResponseDto> {
    return this.registeredNumbersService.importPlivoNumbers(
      req.user.id,
      importPlivoNumbersDto,
    );
  }

  @Post("import-phone-numbers-telecmi")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Import phone numbers from Telecmi",
    description:
      "Import phone numbers from Telecmi account and create LiveKit SIP trunk",
  })
  @ApiBody({ type: ImportTelecmiNumbersDto })
  @ApiResponse({
    status: 201,
    description: "Phone numbers imported successfully",
    type: ImportTelecmiResponseDto,
    example: {
      importedCount: 1,
      livekitOutboundTrunkId: "ST_YTGYHbEZ8PWm",
      importedNumbers: [
        {
          phoneNumber: "+1234567890",
          friendlyName: "+1234567890",
          registeredNumberId: "uuid-here",
        },
      ],
      message: "Successfully imported 1 phone number from Telecmi",
    },
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - validation failed or Telecmi/LiveKit error",
  })
  @ApiResponse({ status: 401, description: "Unauthorized - invalid token" })
  async importTelecmiNumbers(
    @Request() req,
    @Body() importTelecmiNumbersDto: ImportTelecmiNumbersDto,
  ): Promise<ImportTelecmiResponseDto> {
    return this.registeredNumbersService.importTelecmiNumbers(
      req.user.id,
      importTelecmiNumbersDto,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get all registered phone numbers",
    description:
      "Retrieve all registered phone numbers for the authenticated user",
  })
  @ApiResponse({
    status: 200,
    description: "Registered numbers retrieved successfully",
    type: [RegisteredNumberResponseDto],
    example: [
      {
        id: "uuid-here",
        providerName: "twilio",
        friendlyName: "Balaji k",
        phoneNo: "+19282185402",
        livekitOutboundTrunkId: "ST_xn9xEW6gFR3R",
        active: true,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    ],
  })
  @ApiResponse({ status: 401, description: "Unauthorized - invalid token" })
  async findAll(@Request() req): Promise<RegisteredNumberResponseDto[]> {
    const registeredNumbers = await this.registeredNumbersService.findAllByUser(
      req.user.id,
    );
    return registeredNumbers.map(
      (number) => new RegisteredNumberResponseDto(number),
    );
  }

  @Get("dispatch-rules")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get dispatch rules for registered numbers",
    description:
      "Retrieve all SIP dispatch rules for the authenticated user's registered numbers with inbound trunks",
  })
  @ApiResponse({
    status: 200,
    description: "Dispatch rules retrieved successfully",
    type: [DispatchRuleResponseDto],
    example: [
      {
        sipDispatchRuleId: "SDR_uRzWUrE8torL",
        name: "inbound-917943446691-from-sample-app",
        assistantId: "2833c12e-8bcc-4c50-b6ae-c02bc7ea177c",
        assistantName: "hexite-inbound-caller",
        phoneNumber: "+917943446691",
      },
    ],
  })
  @ApiResponse({ status: 401, description: "Unauthorized - invalid token" })
  @ApiResponse({
    status: 400,
    description: "Bad request - LiveKit error or configuration issue",
  })
  async getDispatchRules(@Request() req): Promise<DispatchRuleResponseDto[]> {
    return this.registeredNumbersService.getDispatchRules(req.user.id);
  }

  @Delete("dispatch-rules/:sipDispatchRuleId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Delete a dispatch rule",
    description:
      "Delete a SIP dispatch rule by its ID for the authenticated user's registered numbers",
  })
  @ApiParam({
    name: "sipDispatchRuleId",
    description: "SIP Dispatch Rule ID",
    type: "string",
  })
  @ApiResponse({
    status: 200,
    description: "Dispatch rule deleted successfully",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Dispatch rule deleted successfully",
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized - invalid token" })
  @ApiResponse({
    status: 400,
    description: "Bad request - LiveKit error or dispatch rule not found",
  })
  async deleteDispatchRule(
    @Param("sipDispatchRuleId") sipDispatchRuleId: string,
    @Request() req,
  ): Promise<{ message: string }> {
    await this.registeredNumbersService.deleteDispatchRule(
      sipDispatchRuleId,
      req.user.id,
    );
    return { message: "Dispatch rule deleted successfully" };
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get a registered phone number by ID",
    description:
      "Retrieve a specific registered phone number by ID for the authenticated user",
  })
  @ApiParam({ name: "id", description: "Registered number ID", type: "string" })
  @ApiResponse({
    status: 200,
    description: "Registered number retrieved successfully",
    type: RegisteredNumberResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized - invalid token" })
  @ApiResponse({ status: 404, description: "Registered number not found" })
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<RegisteredNumberResponseDto> {
    const registeredNumber = await this.registeredNumbersService.findOne(
      id,
      req.user.id,
    );
    return new RegisteredNumberResponseDto(registeredNumber);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Update a registered phone number",
    description:
      "Update a specific registered phone number for the authenticated user",
  })
  @ApiParam({ name: "id", description: "Registered number ID", type: "string" })
  @ApiBody({ type: UpdateRegisteredNumberDto })
  @ApiResponse({
    status: 200,
    description: "Registered number updated successfully",
    type: RegisteredNumberResponseDto,
  })
  @ApiResponse({ status: 400, description: "Bad request - validation failed" })
  @ApiResponse({ status: 401, description: "Unauthorized - invalid token" })
  @ApiResponse({ status: 404, description: "Registered number not found" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Request() req,
    @Body() updateRegisteredNumberDto: UpdateRegisteredNumberDto,
  ): Promise<RegisteredNumberResponseDto> {
    const registeredNumber = await this.registeredNumbersService.update(
      id,
      req.user.id,
      updateRegisteredNumberDto,
    );
    return new RegisteredNumberResponseDto(registeredNumber);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Delete a registered phone number",
    description:
      "Delete a specific registered phone number for the authenticated user",
  })
  @ApiParam({ name: "id", description: "Registered number ID", type: "string" })
  @ApiResponse({
    status: 200,
    description: "Registered number deleted successfully",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Registered number deleted successfully",
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized - invalid token" })
  @ApiResponse({ status: 404, description: "Registered number not found" })
  async remove(
    @Param("id", ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<{ message: string }> {
    await this.registeredNumbersService.remove(id, req.user.id);
    return { message: "Registered number deleted successfully" };
  }
}
