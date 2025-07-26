import { Controller, Post, Body, UseGuards, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PromptService } from './prompt.service';
import { GeneratePromptDto } from './dto/generate-prompt.dto';
import { PromptResponseDto } from './dto/prompt-response.dto';

@ApiTags('prompt')
@Controller('prompt')
@UseGuards(ThrottlerGuard)
export class PromptController {
  constructor(private readonly promptService: PromptService) {}

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Generate structured AI prompt',
    description: 'Generate a well-structured AI system prompt based on a task description using OpenAI GPT-4',
  })
  @ApiBody({
    type: GeneratePromptDto,
    description: 'Task description for prompt generation',
    examples: {
      hotelBooking: {
        summary: 'Hotel booking task',
        description: 'Generate prompt for hotel booking assistant',
        value: {
          taskDescription: 'to book a hotel appointment',
        },
      },
      customerSupport: {
        summary: 'Customer support task',
        description: 'Generate prompt for customer support assistant',
        value: {
          taskDescription: 'to handle customer complaints and provide solutions',
        },
      },
      schedulingAssistant: {
        summary: 'Scheduling task',
        description: 'Generate prompt for scheduling assistant',
        value: {
          taskDescription: 'to schedule meetings and manage calendars',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Prompt generated successfully',
    type: PromptResponseDto,
    example: {
      generatedPrompt: `[Identity]
You are a helpful hotel booking assistant specializing in making hotel reservations for customers.

[Style]
Use a friendly, professional, and accommodating tone. Be clear and concise in your communication while maintaining warmth and helpfulness.

[Response Guidelines]
- Always confirm details before proceeding
- Provide clear options when available
- Use bullet points for multiple options
- Ask one question at a time to avoid overwhelming the user

[Task & Goals]
1. Greet the customer and ask for their preferred destination
< wait for user response >
2. Ask for check-in and check-out dates
< wait for user response >
3. Inquire about the number of guests and room preferences
< wait for user response >
4. Present available hotel options with pricing
< wait for user response >
5. Confirm the selected hotel and gather guest details
< wait for user response >
6. Process the booking and provide confirmation details

[Error Handling / Fallback]
If the user provides unclear dates or destinations, politely ask for clarification. If booking systems are unavailable, offer to take their information and follow up via email or phone.`,
      originalTask: 'to book a hotel appointment',
      generatedAt: '2024-01-15T10:30:00.000Z',
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or OpenAI API quota exceeded',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Task description must be at least 3 characters long' },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - invalid or missing JWT token',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Rate limit exceeded',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 429 },
        message: { type: 'string', example: 'ThrottlerException: Too Many Requests' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error or OpenAI API failure',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: { type: 'string', example: 'Failed to generate prompt structure' },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  async generatePrompt(@Body() generatePromptDto: GeneratePromptDto): Promise<PromptResponseDto> {
    return this.promptService.generatePromptStructure(generatePromptDto);
  }
}
