import {
  Controller,
  Post,
  Body,
  Get,
  HttpStatus,
  UseGuards,
  Request,
  HttpException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiBasicAuth,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PhoneService } from "./services/phone.service";
import { MakeCallDto, MakeInboundCallDto } from "./dto/make-call.dto";
import { HangupDto } from "./dto/hangup.dto";

@ApiTags("phone")
@Controller("phone")
export class PhoneController {
  constructor(private readonly phoneService: PhoneService) { }

  @Post("make_call")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiBasicAuth("basic-auth")
  @ApiOperation({
    summary: "Initiate a phone call",
    description:
      "Make a call to the provided phone number without authentication (future support planned).",
  })
  @ApiBody({ type: MakeCallDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Call initiated successfully",
    type: Object,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid input data",
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Insufficient credits to make a call",
  })
  async makeCall(@Body() makeCallDto: MakeCallDto, @Request() req) {
    // Check if user has sufficient credits
    if (req.user.credits <= 0) {
      throw new HttpException(
        "Insufficient credits. Please recharge your account to make calls.",
        HttpStatus.FORBIDDEN,
      );
    }

    const result = await this.phoneService.makeCall(
      makeCallDto,
      req.user.id,
      req.headers.authorization,
    );
    return result;
  }

  @Post("make_inbound_call")
  @ApiOperation({
    summary: "Initiate an inbound phone call without authentication",
    description:
      "Make an inbound call to the provided phone number. User ID is extracted from the selected assistant.",
  })
  @ApiBody({ type: MakeInboundCallDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Inbound call initiated successfully",
    type: Object,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid input data or assistant not found",
  })
  async makeInboundCall(@Body() makeInboundCallDto: MakeInboundCallDto) {
    const result = await this.phoneService.makeInboundCall(makeInboundCallDto);
    return result;
  }

  @Post("hangup")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Hang up an active call",
    description:
      "Terminate the call associated with the provided room name without authentication (future support planned).",
  })
  @ApiBody({ type: HangupDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Call hung up successfully",
    type: Object,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid input data",
  })
  async hangup(@Body() hangupDto: HangupDto) {
    const result = await this.phoneService.hangup(hangupDto);
    return result;
  }

  @Get("active-calls")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Retrieve active call details",
    description:
      "Fetch details of the current active call without authentication (future support planned).",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Active call details retrieved successfully",
    type: Object,
  })
  async getActiveCall() {
    const result = await this.phoneService.getActiveCall();
    return result;
  }
}
