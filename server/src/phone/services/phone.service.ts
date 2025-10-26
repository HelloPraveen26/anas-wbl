import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import { AxiosResponse } from "axios";
import { MakeCallDto } from "../dto/make-call.dto";
import { HangupDto } from "../dto/hangup.dto";
import { AssistantService } from "../../assistant/assistant.service";

@Injectable()
export class PhoneService {
  private readonly baseUrl: string;
  private readonly logger = new Logger(PhoneService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly assistantService: AssistantService,
  ) {
    this.baseUrl =
      this.configService.get<string>("PHONE_SERVICE_URL") ||
      "http://localhost:8003";
  }

  /**
   * Initiates a phone call by proxying the request to the telephony service.
   * @param dto MakeCallDto containing the phone_number to call
   * @returns AxiosResponse<any> with { success: boolean, call_id?: string }
   */
  async makeCall(dto: MakeCallDto, userId: string): Promise<any> {
    try {
      let systemPrompt = "";
      let firstMessage = "";

      // Get systemPrompt and firstMessage from assistant if selectedAssistant is provided
      if (dto.selectedAssistant) {
        this.logger.log(
          `Making call with selected assistant: ${dto.selectedAssistant}`,
        );

        // Note: We need userId to fetch assistant, but it's not available in this context
        // This might need to be passed from the controller or extracted from request context
        try {
          const assistant = await this.assistantService.findOne(
            dto.selectedAssistant,
            userId,
          );
          systemPrompt = assistant.systemPrompt;
          firstMessage = assistant.firstMessage;
        } catch (error) {
          this.logger.warn(
            `Failed to fetch assistant ${dto.selectedAssistant}:`,
            error.message,
          );
        }
      }

      const payload = {
        phone_number: dto.phoneNumber,
        from_phone_number: dto.fromPhoneNumber || "+19282185402",
        ...(systemPrompt && { instructions: systemPrompt }),
        ...(firstMessage && { first_message: firstMessage }),
      };
      this.logger.log(payload);
      const { data } = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/make_call`, payload),
      );
      return data;
    } catch (error) {
      this.logger.error(
        "makeCall failed",
        error instanceof Error ? error.stack : error,
      );
      throw new HttpException(
        "Failed to initiate call",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Hangs up an active call by proxying the request to the telephony service.
   * @param dto HangupDto containing the room_name to hang up
   * @returns AxiosResponse<any> with { success: boolean }
   */
  async hangup(dto: HangupDto): Promise<any> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/hangup`, dto),
      );
      return data;
    } catch (error) {
      this.logger.error(
        "hangup failed",
        error instanceof Error ? error.stack : error,
      );
      throw new HttpException(
        "Failed to hang up call",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Retrieves details of the current active call from the telephony service.
   * @returns AxiosResponse<any> with { active: boolean, call_id?: string }
   */
  async getActiveCall(): Promise<any> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/active_call`),
      );
      return data;
    } catch (error) {
      this.logger.error(
        "getActiveCall failed",
        error instanceof Error ? error.stack : error,
      );
      throw new HttpException(
        "Failed to retrieve active call",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
