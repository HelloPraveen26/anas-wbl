import {
  Controller,
  Post,
  Body,
  Logger,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from "@nestjs/swagger";
import { CallSummaryDto } from "./dto/call-summary.dto";
import { CallLogsService } from "../call-logs/call-logs.service";

@ApiTags("webhooks")
@Controller("webhooks")
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly callLogsService: CallLogsService) {}

  @Post("call-summary")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Receive call summary webhook",
    description:
      "Endpoint to receive detailed call summary data including conversation history, timestamps, and call metrics.",
  })
  @ApiBody({
    description: "Detailed call summary with conversation history",
    type: CallSummaryDto,
    schema: {
      type: "object",
      properties: {
        room_name: {
          type: "string",
          example: "sip-fd6e29e3",
        },
        history: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  type: { type: "string" },
                  role: { type: "string" },
                  content: {
                    type: "array",
                    items: { type: "string" },
                  },
                  new_agent_id: { type: "string" },
                  interrupted: { type: "boolean" },
                  extra: { type: "object" },
                  metrics: {
                    type: "object",
                    properties: {
                      started_speaking_at: { type: "number" },
                      stopped_speaking_at: { type: "number" },
                    },
                  },
                },
              },
              example: [
                {
                  id: "item_6c9b175b7ee3",
                  type: "agent_handoff",
                  new_agent_id: "assistant",
                },
                {
                  id: "GR_7887fee2c470",
                  type: "message",
                  role: "assistant",
                  content: ["Hello How can I help you today"],
                  interrupted: false,
                  extra: {},
                  metrics: {
                    started_speaking_at: 1771866892.414398,
                    stopped_speaking_at: 1771866894.043726,
                  },
                },
                {
                  id: "GI_71db268a330e",
                  type: "message",
                  role: "user",
                  content: ["I just want to know a few information."],
                  interrupted: false,
                  extra: {},
                  metrics: {},
                },
              ],
            },
          },
        },
        captured_at: {
          type: "string",
          example: "2026-02-23T17:15:39.339795+00:00",
        },
        call_start_time: {
          type: "string",
          example: "2026-02-23T17:14:34.870660+00:00",
        },
        call_end_time: {
          type: "string",
          example: "2026-02-23T17:15:39.319380+00:00",
        },
        call_duration_seconds: {
          type: "number",
          example: 64.44871997833252,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Call summary received successfully",
    schema: {
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        message: {
          type: "string",
          example: "Call summary received and logged",
        },
        timestamp: { type: "string", example: "2024-01-01T00:00:00.000Z" },
        room_name: { type: "string", example: "sip-fd6e29e3" },
        message_count: { type: "number", example: 5 },
        duration_seconds: { type: "number", example: 64.45 },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid call summary data",
  })
  async receiveCallSummary(@Body() callSummary: CallSummaryDto) {
    this.logger.log("=".repeat(80));
    this.logger.log("📞 CALL SUMMARY WEBHOOK RECEIVED");
    this.logger.log("=".repeat(80));

    this.logger.log(`Room Name: ${callSummary.room_name}`);
    this.logger.log(
      `Call Duration: ${callSummary.call_duration_seconds.toFixed(2)} seconds`,
    );
    this.logger.log(`Call Start: ${callSummary.call_start_time}`);
    this.logger.log(`Call End: ${callSummary.call_end_time}`);
    this.logger.log(
      `Message Count: ${callSummary.history?.items?.length || 0}`,
    );
    try {
      const callLog = await this.callLogsService.findBySessionId(
        callSummary.room_name,
      );

      if (callLog) {
        await this.callLogsService.updateBySessionId(callSummary.room_name, {
          duration: Math.round(callSummary.call_duration_seconds),
          callStatus: "completed",
        });
        this.logger.log(
          `✅ Updated call log ${callLog.id} with duration and status`,
        );
      } else {
        this.logger.warn(
          `⚠️ No call log found for session ID: ${callSummary.room_name}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `❌ Error updating call log: ${error.message}`,
        error.stack,
      );
    }

    return {
      success: true,
      message: "Call summary received and logged",
      timestamp: new Date().toISOString(),
      room_name: callSummary.room_name,
      message_count: callSummary.history?.items?.length || 0,
      duration_seconds: callSummary.call_duration_seconds,
    };
  }
}
