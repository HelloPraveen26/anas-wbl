import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserResponseDto } from './dto/user-response.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(ThrottlerGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Get current user profile',
    description: 'Retrieve detailed profile information of the currently authenticated user'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User profile retrieved successfully', 
    type: UserResponseDto,
    example: {
      id: 'uuid-here',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      isVerified: true,
      authProvider: 'local',
      profilePicture: 'https://example.com/avatar.jpg',
      lastLogin: '2024-01-01T00:00:00.000Z',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      fullName: 'John Doe'
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid token' })
  async getProfile(@Request() req): Promise<UserResponseDto> {
    const user = await this.usersService.findById(req.user.id);
    return new UserResponseDto(user);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Update current user profile',
    description: 'Update profile information of the currently authenticated user'
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ 
    status: 200, 
    description: 'User profile updated successfully', 
    type: UserResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid token' })
  async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.usersService.update(req.user.id, updateUserDto);
    return new UserResponseDto(user);
  }

  @Delete('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Delete current user account',
    description: 'Permanently delete the currently authenticated user account (soft delete)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User account deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Account deleted successfully' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid token' })
  async deleteAccount(@Request() req): Promise<{ message: string }> {
    await this.usersService.remove(req.user.id);
    return { message: 'Account deleted successfully' };
  }
}