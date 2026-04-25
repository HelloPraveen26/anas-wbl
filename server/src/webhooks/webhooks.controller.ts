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
import { ChatLogsService } from "../chat-logs/chat-logs.service";
import { UsersService } from "../users/users.service";

@ApiTags("webhooks")
@Controller("webhooks")
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly callLogsService: CallLogsService,
    private readonly chatLogsService: ChatLogsService,
    private readonly usersService: UsersService,
  ) { }

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
        start_time: {
          type: "string",
          example: "2026-02-23T17:14:34.870660+00:00",
        },
        end_time: {
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
    this.logger.log(`Call Start: ${callSummary.start_time}`);
    this.logger.log(`Call End: ${callSummary.end_time}`);
    this.logger.log(
      `Message Count: ${callSummary.history?.items?.length || 0}`,
    );
    try {
      let callLog;
      if (callSummary.type === "inbound" && callSummary.call_log_id) {
        callLog = await this.callLogsService.findOne(callSummary.call_log_id);
      } else {
        callLog = await this.callLogsService.findBySessionId(
          callSummary.room_name,
        );
      }

      if (callLog) {
        const historyItems = callSummary.history?.items || [];
        const processedHistory = historyItems
          .filter(
            (item) =>
              item.role !== undefined &&
              item.content !== undefined,
          )
          .map((item) => ({
            role: item.role,
            content: Array.isArray(item.content)
              ? item.content.join(" ")
              : item.content,
            interrupted: item.interrupted ?? false,
          }));

        this.logger.log(
          `📊 Processed history count: ${processedHistory.length}`,
        );
        this.logger.log(
          `📊 Raw call_duration_seconds from agent: ${callSummary.call_duration_seconds}`,
        );
        let durationInSeconds = Math.round(
          Number(callSummary.call_duration_seconds) || 0,
        );

        // 🧠 Smarter status determination
        const hasUserMessages = processedHistory.some(
          (item) => item.role === "user",
        );
        const isConnected = callSummary.participant_connected !== false;

        let finalStatus: string = "completed";

        if (!isConnected) {
          finalStatus = "unanswered";
        } else if (!hasUserMessages) {
          // ❌ No user speech detected -> Mark as unanswered/unbilled
          // This ensures that silent calls, voicemails, or short pickup/hangups without interaction
          // are not charged to the user.
          finalStatus = "unanswered";
        }

        // 💰 Calculate cost ONLY for completed calls
        let costInRupees = 0;
        if (finalStatus === "completed") {
          costInRupees = (durationInSeconds * 3.85) / 60;
        }

        await this.callLogsService.update(callLog.id, {
          duration: durationInSeconds,
          cost: costInRupees,
          callStatus: finalStatus,
          sessionId: callSummary.room_name,
          roomName: callSummary.room_name,
        });

        this.logger.log(
          `${finalStatus === "completed" ? "✅" : "⚠️"} Updated call log ${callLog.id} with duration: ${durationInSeconds}s, cost: ₹${costInRupees.toFixed(4)}, status: ${finalStatus}`,
        );

        if (finalStatus === "completed") {
          try {
            const user = await this.usersService.findById(callLog.userId);
            const currentCredits = Number(user.credits);
            const newCredits = parseFloat(
              (currentCredits - costInRupees).toFixed(2),
            );

            await this.usersService.update(callLog.userId, {
              credits: newCredits,
            });

            this.logger.log(
              `✅ Deducted ₹${costInRupees.toFixed(4)} from user ${callLog.userId}. Credits: ₹${currentCredits.toFixed(4)} → ₹${newCredits.toFixed(4)}`,
            );
          } catch (creditError) {
            this.logger.error(
              `❌ Error deducting credits from user ${callLog.userId}: ${creditError.message}`,
            );
          }
        }

        if (processedHistory.length > 0) {
          try {
            await this.chatLogsService.create({
              callLogId: callLog.id,
              roomName: callSummary.room_name,
              history: processedHistory,
            });
            this.logger.log(
              `✅ Saved ${processedHistory.length} chat messages to chat log`,
            );
          } catch (chatLogError) {
            this.logger.error(
              `❌ Error saving chat log: ${chatLogError.message}`,
              chatLogError.stack,
            );
          }
        }
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
