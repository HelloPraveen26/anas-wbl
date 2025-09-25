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
      const { data } = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/make_call`, dto),
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
