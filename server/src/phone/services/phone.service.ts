import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import { AxiosResponse } from "axios";
import { MakeCallDto } from "../dto/make-call.dto";
import { HangupDto } from "../dto/hangup.dto";

@Injectable()
export class PhoneService {
  private readonly baseUrl: string;
  private readonly logger = new Logger(PhoneService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
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
  async makeCall(dto: MakeCallDto): Promise<any> {
    try {
      // Log the selected assistant for tracking
      if (dto.selectedAssistant) {
        this.logger.log(
          `Making call with selected assistant: ${dto.selectedAssistant}`,
        );
      }

      // Prepare the payload for the telephony service
      const payload = { ...dto };

      // Map systemPrompt to instructions if provided
      if (dto.systemPrompt) {
        payload.instructions = dto.systemPrompt;
        // Remove systemPrompt from the payload to avoid sending duplicate data
        delete payload.systemPrompt;
      }

      // Map firstMessage to first_message if provided
      if (dto.firstMessage) {
        payload.first_message = dto.firstMessage;
        // Remove firstMessage from the payload to avoid sending duplicate data
        delete payload.firstMessage;
      }

      // Remove selectedAssistant from payload as it's only for logging
      delete payload.selectedAssistant;

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
