import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { CallLogsService } from './call-logs.service';
import { CallLog } from './entities/call-log.entity';

@Controller('call-logs')
export class CallLogsController {
  constructor(private readonly callLogsService: CallLogsService) { }

  // ---- FRONTEND ----
  @Get()
  async findAll(): Promise<CallLog[]> {
    return this.callLogsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CallLog> {
    return this.callLogsService.findOne(id);
  }

  // ---- DEMO SEED ----
  @Post('demo')
  async createDemoLog(): Promise<CallLog> {
    const demoLog: Partial<CallLog> = {
      id: 'CALL_DEMO_123',
      assistantId: 'some-uuid', // Replace with actual assistant ID
      assistantPhone: '+15550001111',
      customerPhone: '+15558889999',
      type: 'inbound',
      callStatus: 'completed',
      successEvaluation: '✅',
      startTime: new Date(),
      duration: 180,
      cost: 0.32,
    };

    return this.callLogsService.create(demoLog);
  }

  // ---- WEBHOOK: Twilio ----
  @Post('twilio-webhook')
  async handleTwilioWebhook(@Body() body: any) {
    const log: Partial<CallLog> = {
      id: body.CallSid,
      assistantId: 'some-uuid', // ⚠️ map properly from body or context
      assistantPhone: body.To,
      customerPhone: body.From,
      type: body.Direction,
      callStatus: body.CallStatus,
      startTime: new Date(),
      duration: parseInt(body.CallDuration || '0', 10),
      cost: body.Price ? Math.abs(parseFloat(body.Price)) : 0,
    };

    const existing = await this.callLogsService.findOne(log.id);
    if (existing) {
      return this.callLogsService.update(log.id, log);
    }
    return this.callLogsService.create(log);
  }

  // ---- WEBHOOK: Vapi ----
  @Post('vapi-webhook')
  async handleVapiWebhook(@Body() body: any) {
    const call = body.call || {};

    const log: Partial<CallLog> = {
      id: call.id,
      assistantId: call.assistant?.id || 'some-uuid', // Assuming call.assistant has id
      assistantPhone: call.assistantPhone,
      customerPhone: call.customerPhone,
      type: call.type,
      callStatus: call.status,
      successEvaluation: call.successEvaluation,
      startTime: call.startTime ? new Date(call.startTime) : new Date(),
      duration: call.duration,
      cost: call.cost,
    };

    const existing = await this.callLogsService.findOne(log.id);
    if (existing) {
      return this.callLogsService.update(log.id, log);
    }
    return this.callLogsService.create(log);
  }
}
