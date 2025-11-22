import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import { AxiosResponse } from "axios";
import { MakeCallDto } from "../dto/make-call.dto";
import { HangupDto } from "../dto/hangup.dto";
import { AssistantService } from "../../assistant/assistant.service";
import { RegisteredNumbersService } from "../../registered-numbers/registered-numbers.service";

@Injectable()
export class PhoneService {
  private readonly baseUrl: string;
  private readonly logger = new Logger(PhoneService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly assistantService: AssistantService,
    private readonly registeredNumbersService: RegisteredNumbersService,
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

      // Get systemPrompt, firstMessage, and model configs from assistant if selectedAssistant is provided
      let sttProviderName: string | undefined;
      let ttsProviderName: string | undefined;
      let sttConfig: Record<string, any> | undefined;
      let ttsConfig: Record<string, any> | undefined;

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

          // Extract STT provider name from transcriber model
          if (assistant.transcriberModel?.transcriberProvider) {
            sttProviderName =
              assistant.transcriberModel.transcriberProvider.name;
            this.logger.log(`STT Provider Name: ${sttProviderName}`);
          }

          // Extract TTS provider name from synthesizer voice
          if (
            assistant.synthesizerVoice?.synthesizerModel?.synthesizerProvider
          ) {
            ttsProviderName =
              assistant.synthesizerVoice.synthesizerModel.synthesizerProvider
                .name;
            this.logger.log(`TTS Provider Name: ${ttsProviderName}`);
          }

          // Extract STT config
          if (assistant.sttConfig) {
            sttConfig = assistant.sttConfig;
            this.logger.log(`STT Config: ${JSON.stringify(sttConfig)}`);
          }

          // Extract TTS config
          if (assistant.ttsConfig) {
            ttsConfig = assistant.ttsConfig;
            this.logger.log(`TTS Config: ${JSON.stringify(ttsConfig)}`);
          }
        } catch (error) {
          this.logger.warn(
            `Failed to fetch assistant ${dto.selectedAssistant}:`,
            error.message,
          );
        }
      }

      // Get livekitOutboundTrunkId from registered number using fromPhoneNumber
      const fromPhoneNumber = dto.fromPhoneNumber || "+19282185402";
      const registeredNumbers =
        await this.registeredNumbersService.findAllByUser(userId);
      const registeredNumber = registeredNumbers.find(
        (num) => num.phoneNo === fromPhoneNumber,
      );

      if (!registeredNumber || !registeredNumber.livekitOutboundTrunkId) {
        this.logger.error(
          `Outbound trunk ID missing for phone number: ${fromPhoneNumber}`,
        );
        throw new HttpException(
          "Outbound trunk ID missing for the selected phone number",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const payload = {
        phone_number: dto.phoneNumber,
        from_phone_number: fromPhoneNumber,
        outbound_trunk_id: registeredNumber.livekitOutboundTrunkId,
        ...(systemPrompt && { instructions: systemPrompt }),
        ...(firstMessage && { first_message: firstMessage }),
        ...(sttProviderName && { stt_provider_name: sttProviderName }),
        ...(ttsProviderName && { tts_provider_name: ttsProviderName }),
        ...(sttConfig && { stt_config: sttConfig }),
        ...(ttsConfig && { tts_config: ttsConfig }),
      };

      this.logger.log(
        `Making call with payload: ${JSON.stringify(payload, null, 2)}`,
      );

      const { data } = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/make_call`, payload),
      );

      this.logger.log(
        `Call initiated successfully. Response: ${JSON.stringify(data)}`,
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
