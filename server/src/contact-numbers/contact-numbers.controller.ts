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
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ContactNumbersService } from "./contact-numbers.service";
import { CreateContactNumberDto } from "./dto/create-contact-number.dto";
import { UpdateContactNumberDto } from "./dto/update-contact-number.dto";

@ApiTags("contact-numbers")
@ApiBearerAuth("JWT-auth")
@Controller("contact-numbers")
@UseGuards(JwtAuthGuard)
export class ContactNumbersController {
  constructor(private readonly contactNumbersService: ContactNumbersService) {}

  @Post()
  @ApiOperation({ summary: "Create a new contact number" })
  @ApiResponse({
    status: 201,
    description: "Contact number created successfully",
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  create(
    @Body() createContactNumberDto: CreateContactNumberDto,
    @Request() req,
  ) {
    return this.contactNumbersService.create(
      createContactNumberDto,
      req.user.id,
    );
  }

  @Get()
  @ApiOperation({ summary: "Get all contact numbers for authenticated user" })
  @ApiResponse({
    status: 200,
    description: "Contact numbers retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  findAll(@Request() req) {
    return this.contactNumbersService.findAllByUser(req.user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a specific contact number by ID" })
  @ApiResponse({
    status: 200,
    description: "Contact number retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Contact number not found" })
  findOne(@Param("id") id: string, @Request() req) {
    return this.contactNumbersService.findOne(id, req.user.id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a contact number" })
  @ApiResponse({
    status: 200,
    description: "Contact number updated successfully",
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Contact number not found" })
  update(
    @Param("id") id: string,
    @Body() updateContactNumberDto: UpdateContactNumberDto,
    @Request() req,
  ) {
    return this.contactNumbersService.update(
      id,
      updateContactNumberDto,
      req.user.id,
    );
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a contact number" })
  @ApiResponse({
    status: 200,
    description: "Contact number deleted successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Contact number not found" })
  remove(@Param("id") id: string, @Request() req) {
    return this.contactNumbersService.remove(id, req.user.id);
  }
}
