import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ApiTags } from "@nestjs/swagger";
import { PhoneController } from "./phone.controller";
import { PhoneService } from "./services/phone.service";
import { AssistantModule } from "../assistant/assistant.module";
import { RegisteredNumbersModule } from "../registered-numbers/registered-numbers.module";
import { CallLogsModule } from "../call-logs/call-logs.module";

@ApiTags("phone")
@Module({
  imports: [
    HttpModule,
    AssistantModule,
    RegisteredNumbersModule,
    CallLogsModule,
  ],
  controllers: [PhoneController],
  providers: [PhoneService],
})
export class PhoneModule {}
