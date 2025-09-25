import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ApiTags } from "@nestjs/swagger";
import { PhoneController } from "./phone.controller";
import { PhoneService } from "./services/phone.service";

@ApiTags("phone")
@Module({
  imports: [HttpModule],
  controllers: [PhoneController],
  providers: [PhoneService],
})
export class PhoneModule {}
