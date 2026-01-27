// phone.service.ts - UPDATED WITH DEBUG LOGGING

import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import { MakeCallDto } from "../dto/make-call.dto";
import { HangupDto } from "../dto/hangup.dto";
import { AssistantService } from "../../assistant/assistant.service";
import { RegisteredNumbersService } from "../../registered-numbers/registered-numbers.service";
import { CallLogsService } from "../../call-logs/call-logs.service";
import { renderTemplate } from "../../common/utils/template.util";

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

  async makeCall(dto: MakeCallDto, userId: string): Promise<any> {
    let callLogId: string | null = null;

    // 🔍 DEBUG: Log incoming DTO
    this.logger.log("=".repeat(80));
    this.logger.log("🔍 DEBUG: INCOMING MAKE CALL DTO");
    this.logger.log("=".repeat(80));
    this.logger.log(`Phone Number: ${dto.phoneNumber}`);
    this.logger.log(`Selected Assistant: ${dto.selectedAssistant}`);
    this.logger.log(`Metadata Present: ${dto.metadata ? "YES" : "NO"}`);
    if (dto.metadata) {
      this.logger.log(`Metadata Keys: ${Object.keys(dto.metadata).join(", ")}`);
      this.logger.log(
        `Metadata Content: ${JSON.stringify(dto.metadata, null, 2)}`,
      );
    }
    this.logger.log("=".repeat(80));

    try {
      let systemPrompt = "";
      let firstMessage = "";
      let realtimeProviderName: string | undefined;
      let llmProviderName: string | undefined;
      let sttProviderName: string | undefined;
      let ttsProviderName: string | undefined;
      let llmConfig: Record<string, any> | undefined;
      let realtimeModelConfig: Record<string, any> | undefined;
      let sttConfig: Record<string, any> | undefined;
      let ttsConfig: Record<string, any> | undefined;
      let toolConfig: any = null;
      let webhookUrl = "http://127.0.0.1:9005/";

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

          if (dto.metadata && systemPrompt) {
            systemPrompt = renderTemplate(systemPrompt, dto.metadata);
          }

          firstMessage = assistant.firstMessage;

          if (assistant.realtimeModel?.realtimeProvider) {
            realtimeProviderName =
              assistant.realtimeModel?.realtimeProvider?.name;
            realtimeModelConfig = {
              ...assistant.realtimeConfig,
              model: assistant.realtimeModel?.name,
            };
            this.logger.log(`Realtime Provider Name: ${realtimeProviderName}`);
          }

          if (assistant.llmModel?.llmProvider) {
            llmProviderName = assistant.llmModel?.llmProvider?.name;
            llmConfig = { model_name: assistant.llmModel?.name };
            this.logger.log(`LLM Provider Name: ${llmProviderName}`);
          }

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

          toolConfig = await this.getToolConfig(dto.selectedAssistant);

          if (toolConfig) {
            this.logger.log(
              `🔧 Tool configured: ${toolConfig.toolName} with ${Object.keys(toolConfig.parameters || {}).length} parameters`,
            );
            webhookUrl = toolConfig.webhookUrl || webhookUrl;

            // 🔍 DEBUG: Log tool parameters
            this.logger.log("🔍 Tool Parameters:");
            Object.keys(toolConfig.parameters || {}).forEach((param) => {
              this.logger.log(
                `   • ${param} (required: ${toolConfig.parameters[param].required})`,
              );
            });
          }
        } catch (error) {
          this.logger.warn(
            `⚠️ Failed to fetch assistant details:`,
            error instanceof Error ? error.message : error,
          );
        }
      }

      const fromPhoneNumber = dto.fromPhoneNumber || "+19282185402";

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

      // 🔍 DEBUG: Extract and log metadata
      const customMetadata = dto.metadata || {};

      this.logger.log("=".repeat(80));
      this.logger.log("🔍 DEBUG: PREPARING METADATA FOR AGENT");
      this.logger.log("=".repeat(80));
      this.logger.log(
        `Custom Metadata Keys: ${Object.keys(customMetadata).join(", ") || "NONE"}`,
      );
      if (Object.keys(customMetadata).length > 0) {
        this.logger.log("Custom Metadata Content:");
        Object.entries(customMetadata).forEach(([key, value]) => {
          this.logger.log(`   • ${key}: ${value}`);
        });
      } else {
        this.logger.warn("⚠️ NO CUSTOM METADATA FOUND IN DTO!");
      }
      this.logger.log("=".repeat(80));

      // Determine sip_headers based on provider_name and from_phone_number
      let sipHeaders = {};
      if (registeredNumber.providerName === "telecmi") {
        if (["+917943446693"].includes(fromPhoneNumber)) {
          sipHeaders = {
            "X-Piopiy-Username": "agarwalpackers",
          };
        } else if (["+917943446695"].includes(fromPhoneNumber)) {
          sipHeaders = {
            "X-Piopiy-Username": "vidhuacademy",
          };
        } else if (["+917943446690"].includes(fromPhoneNumber)) {
          sipHeaders = {
            "X-Piopiy-Username": "gnsolutions",
          };
        } else {
          sipHeaders = {
            "X-Piopiy-Username": "zenaisip",
          };
        }
      }

      const payload = {
        user_id: userId,
        phone_number: dto.phoneNumber,
        from_phone_number: fromPhoneNumber,
        outbound_trunk_id: registeredNumber.livekitOutboundTrunkId,
        ...(instructions && { instructions }),
        ...(firstMessage && { first_message: firstMessage }),
        ...(realtimeProviderName && {
          realtime_provider_name: realtimeProviderName,
        }),
        ...(sttProviderName && { stt_provider_name: sttProviderName }),
        ...(ttsProviderName && { tts_provider_name: ttsProviderName }),
        ...(realtimeModelConfig && {
          realtime_model_config: realtimeModelConfig,
        }),
        ...(sttConfig && { stt_config: sttConfig }),
        ...(ttsConfig && { tts_config: ttsConfig }),
        ...(dto.selectedAssistant && { assistant_id: dto.selectedAssistant }),
        ...(webhookUrl && { webhook_url: webhookUrl }),
        ...(Object.keys(customMetadata).length > 0 && {
          metadata: customMetadata,
        }),
        ...(Object.keys(sipHeaders).length > 0 && { sip_headers: sipHeaders }),
      };

      // 🔍 DEBUG: Log final payload
      this.logger.log("=".repeat(80));
      this.logger.log("🔍 DEBUG: FINAL PAYLOAD TO PHONE SERVICE");
      this.logger.log("=".repeat(80));
      this.logger.log(
        `Payload has metadata: ${payload.hasOwnProperty("metadata") ? "YES" : "NO"}`,
      );
      this.logger.log(`Full payload:\n${JSON.stringify(payload, null, 2)}`);
      this.logger.log("=".repeat(80));

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
        toolConfig,
      };
    } catch (error) {
      this.logger.error(
        "❌ makeCall failed",
        error instanceof Error ? error.stack : error,
      );

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
