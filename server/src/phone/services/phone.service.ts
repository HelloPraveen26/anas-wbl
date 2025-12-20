import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import { AxiosResponse } from "axios";
import { MakeCallDto } from "../dto/make-call.dto";
import { HangupDto } from "../dto/hangup.dto";
import { AssistantService } from "../../assistant/assistant.service";
import { RegisteredNumbersService } from "../../registered-numbers/registered-numbers.service";
import { CallLogsService } from "../../call-logs/call-logs.service";

@Injectable()
export class PhoneService {
  private readonly baseUrl: string;
  private readonly logger = new Logger(PhoneService.name);
  private readonly agentServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly assistantService: AssistantService,
    private readonly registeredNumbersService: RegisteredNumbersService,
    private readonly callLogsService: CallLogsService,
  ) {
    this.baseUrl =
      this.configService.get<string>("PHONE_SERVICE_URL") ||
      "http://localhost:8003";
    this.agentServiceUrl =
      this.configService.get<string>("AGENT_SERVICE_URL") ||
      "http://localhost:8000";
  }

  /**
   * Load tool configuration for an assistant
   */
  async getToolConfig(assistantId: string): Promise<any> {
    try {
      this.logger.log(`🔄 Fetching tool config for assistant: ${assistantId}`);

      const response = await firstValueFrom(
        this.httpService.get(
          `${this.agentServiceUrl}/api/v1/assistants/tool-config/${assistantId}`,
        ),
      );

      if (response.data?.success && response.data?.data) {
        this.logger.log(
          `✅ Tool config loaded: ${response.data.data.toolName}`,
        );
        return response.data.data;
      }

      this.logger.warn(`⚠️ No tool configuration found for assistant`);
      return null;
    } catch (error) {
      this.logger.warn(
        `⚠️ Error loading tool config: ${error instanceof Error ? error.message : error}`,
      );
      return null;
    }
  }

  /**
   * Initiates a phone call with tool configuration support
   */
  async makeCall(dto: MakeCallDto, userId: string): Promise<any> {
    let callLogId: string | null = null;

    try {
      let systemPrompt = "";
      let firstMessage = "";
      // Get systemPrompt, firstMessage, and model configs from assistant if selectedAssistant is provided
      let llmProviderName: string | undefined;
      let sttProviderName: string | undefined;
      let ttsProviderName: string | undefined;
      let llmConfig: Record<string, any> | undefined;
      let sttConfig: Record<string, any> | undefined;
      let ttsConfig: Record<string, any> | undefined;
      let toolConfig: any = null;
      let webhookUrl = "http://127.0.0.1:9005/"; // Default webhook

      // Get assistant details if selectedAssistant is provided
      if (dto.selectedAssistant) {
        this.logger.log(
          `📞 Making call with selected assistant: ${dto.selectedAssistant}`,
        );

        try {
          const assistant = await this.assistantService.findOne(
            dto.selectedAssistant,
            userId,
          );
          systemPrompt = assistant.systemPrompt;
          firstMessage = assistant.firstMessage;

          if (assistant.llmModel?.llmProvider) {
            llmProviderName = assistant.llmModel?.llmProvider?.name;
            llmConfig = { model_name: assistant.llmModel?.name };
            this.logger.log(`LLM Provider Name: ${llmProviderName}`);
          }

          // Extract STT provider name from transcriber model
          if (assistant.transcriberModel?.transcriberProvider) {
            sttProviderName =
              assistant.transcriberModel.transcriberProvider.name;
            this.logger.log(`🎤 STT Provider: ${sttProviderName}`);
          }

          if (assistant.synthesizerModel?.synthesizerProvider) {
            ttsProviderName =
              assistant.synthesizerModel.synthesizerProvider.name;
            this.logger.log(`🔊 TTS Provider: ${ttsProviderName}`);
          }

          if (assistant.sttConfig) {
            sttConfig = assistant.sttConfig;
          }

          if (assistant.ttsConfig) {
            ttsConfig = assistant.ttsConfig;
          }

          // 🔧 NEW: Load tool configuration for this assistant
          toolConfig = await this.getToolConfig(dto.selectedAssistant);

          if (toolConfig) {
            this.logger.log(
              `🔧 Tool configured: ${toolConfig.toolName} with ${Object.keys(toolConfig.parameters || {}).length} parameters`,
            );
            webhookUrl = toolConfig.webhookUrl || webhookUrl;
          }
        } catch (error) {
          this.logger.warn(
            `⚠️ Failed to fetch assistant details:`,
            error instanceof Error ? error.message : error,
          );
        }
      }

      // Get livekitOutboundTrunkId from registered number
      const fromPhoneNumber = dto.fromPhoneNumber || "+19282185402";

      // Create initial call log entry
      const initialCallLog = await this.callLogsService.create({
        assistantId: dto.selectedAssistant || null,
        userId: userId,
        assistantPhone: fromPhoneNumber,
        customerPhone: dto.phoneNumber,
        type: "outbound",
        callStatus: null,
        startTime: new Date(),
      });
      callLogId = initialCallLog.id;
      const registeredNumbers =
        await this.registeredNumbersService.findAllByUser(userId);
      const registeredNumber = registeredNumbers.find(
        (num) => num.phoneNo === fromPhoneNumber,
      );

      if (!registeredNumber || !registeredNumber.livekitOutboundTrunkId) {
        this.logger.error(
          `❌ Outbound trunk ID missing for phone number: ${fromPhoneNumber}`,
        );
        throw new HttpException(
          "Outbound trunk ID missing for the selected phone number",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // 🔧 Build instructions that include tool parameters if configured
      let instructions = systemPrompt;
      if (toolConfig) {
        const requiredFields = Object.keys(toolConfig.parameters || {})
          .filter((k) => toolConfig.parameters[k].required)
          .join(", ");

        const toolInstructions = `

IMPORTANT - DATA COLLECTION TOOL ACTIVATED:
You are configured with a data collection tool. Your primary mission is to collect the following information:
Required fields: ${requiredFields}

When the user provides ANY of this information, IMMEDIATELY call the collect_user_data tool with the appropriate key and value. Extract information naturally from conversation - don't make it feel like an interrogation.

After collecting all required information, the system will automatically send the data to the webhook.`;

        instructions = instructions
          ? instructions + toolInstructions
          : toolInstructions;
      }

      const payload = {
        user_id: userId,
        phone_number: dto.phoneNumber,
        from_phone_number: fromPhoneNumber,
        outbound_trunk_id: registeredNumber.livekitOutboundTrunkId,
        ...(instructions && { instructions }),
        ...(firstMessage && { first_message: firstMessage }),
        ...(sttProviderName && { stt_provider_name: sttProviderName }),
        ...(ttsProviderName && { tts_provider_name: ttsProviderName }),
        ...(sttConfig && { stt_config: sttConfig }),
        ...(ttsConfig && { tts_config: ttsConfig }),
        // 🔧 Add assistant ID and webhook for tool data forwarding
        ...(dto.selectedAssistant && { assistant_id: dto.selectedAssistant }),
        ...(webhookUrl && { webhook_url: webhookUrl }),
      };

      this.logger.log(
        `📤 Sending call payload:\n${JSON.stringify(payload, null, 2)}`,
      );

      const { data } = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/make_call`, payload),
      );

      this.logger.log(
        `✅ Call initiated successfully. Call ID: ${data.call_id || "N/A"}`,
      );

      if (data.room_name && callLogId) {
        await this.callLogsService.update(callLogId, {
          sessionId: data.room_name,
        });
      }
      return {
        ...data,
        toolConfig, // Return tool config to frontend for UI display
      };
    } catch (error) {
      this.logger.error(
        "❌ makeCall failed",
        error instanceof Error ? error.stack : error,
      );

      // Update call log with failure status
      if (callLogId) {
        try {
          await this.callLogsService.update(callLogId, {
            callStatus: "fail",
          });
        } catch (logError) {
          this.logger.error(
            "Failed to update call log with failure status",
            logError,
          );
        }
      }

      throw new HttpException(
        "Failed to initiate call",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Hangs up an active call
   */
  async hangup(dto: HangupDto): Promise<any> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/hangup`, dto),
      );
      this.logger.log(`✅ Call hung up successfully`);
      return data;
    } catch (error) {
      this.logger.error(
        "❌ hangup failed",
        error instanceof Error ? error.stack : error,
      );
      throw new HttpException(
        "Failed to hang up call",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Retrieves active call details
   */
  async getActiveCall(): Promise<any> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/active_call`),
      );
      return data;
    } catch (error) {
      this.logger.error(
        "❌ getActiveCall failed",
        error instanceof Error ? error.stack : error,
      );
      throw new HttpException(
        "Failed to retrieve active call",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
