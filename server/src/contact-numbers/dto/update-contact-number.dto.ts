import { PartialType } from "@nestjs/mapped-types";
import { CreateContactNumberDto } from "./create-contact-number.dto";

export class UpdateContactNumberDto extends PartialType(CreateContactNumberDto) {}
