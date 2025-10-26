import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ApiTags } from "@nestjs/swagger";
import { PhoneController } from "./phone.controller";
import { PhoneService } from "./services/phone.service";
import { AssistantModule } from "../assistant/assistant.module";

@ApiTags("phone")
@Module({
  imports: [HttpModule, AssistantModule],
  controllers: [PhoneController],
  providers: [PhoneService],
})
export class PhoneModule {}
