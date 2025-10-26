import {
  Controller,
  Post,
  Body,
  Get,
  HttpStatus,
  UseGuards,
  Request,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PhoneService } from "./services/phone.service";
import { MakeCallDto } from "./dto/make-call.dto";
import { HangupDto } from "./dto/hangup.dto";

@ApiTags("phone")
@Controller("phone")
export class PhoneController {
  constructor(private readonly phoneService: PhoneService) {}

  @Post("make_call")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
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
  async makeCall(@Body() makeCallDto: MakeCallDto, @Request() req) {
    const result = await this.phoneService.makeCall(makeCallDto, req.user.id);
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

  @Get("active_call")
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
