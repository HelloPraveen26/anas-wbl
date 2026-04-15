import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  Response,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from "@nestjs/swagger";
import { ThrottlerGuard, Throttle, SkipThrottle } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import { SignUpDto } from "./dto/signup.dto";
import { SignInDto } from "./dto/signin.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { AuthResponseDto } from "./dto/auth-response.dto";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

@ApiTags("auth")
@Controller("auth")
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post("signup")
  @ApiOperation({
    summary: "Register a new user account",
    description:
      "Create a new user account with email and password. Email verification will be sent in production.",
  })
  @ApiBody({ type: SignUpDto })
  @ApiResponse({
    status: 201,
    description: "User registered successfully",
    type: AuthResponseDto,
    example: {
      success: true,
      message: "Account created successfully",
      data: {
        user: {
          id: "uuid-here",
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          phone: "+1234567890",
          isVerified: true,
        },
        token: "jwt-token-here",
      },
    },
  })
  @ApiResponse({ status: 400, description: "Bad request - validation failed" })
  @ApiResponse({ status: 409, description: "Conflict - user already exists" })
  async signUp(@Body() signUpDto: SignUpDto): Promise<AuthResponseDto> {
    return this.authService.signUp(signUpDto);
  }

  @Post("signin")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Sign in with email and password",
    description: "Authenticate user with email and password credentials",
  })
  @ApiBody({ type: SignInDto })
  @ApiResponse({
    status: 200,
    description: "User signed in successfully",
    type: AuthResponseDto,
    example: {
      success: true,
      message: "Sign in successful",
      data: {
        user: {
          id: "uuid-here",
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          phone: "+1234567890",
          isVerified: true,
        },
        token: "jwt-token-here",
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - invalid credentials",
  })
  async signIn(@Body() signInDto: SignInDto): Promise<AuthResponseDto> {
    return this.authService.signIn(signInDto);
  }

  @Post("admin/signin")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Sign in as administrator via Hub",
    description: "Authenticate admin user using central Hub credentials",
  })
  @ApiBody({ type: SignInDto })
  @ApiResponse({
    status: 200,
    description: "Admin signed in successfully",
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - invalid Hub credentials",
  })
  async adminSignIn(@Body() signInDto: SignInDto): Promise<AuthResponseDto> {
    return this.authService.adminSignIn(signInDto);
  }

  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Request password reset email",
    description:
      "Send password reset email to user if account exists. Always returns success to prevent email enumeration.",
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: "Password reset email sent if account exists",
    schema: {
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        message: {
          type: "string",
          example:
            "If an account with that email exists, a password reset link has been sent",
        },
      },
    },
  })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Reset password with token",
    description: "Reset user password using the token received via email",
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: "Password reset successful",
    schema: {
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        message: { type: "string", example: "Password reset successful" },
      },
    },
  })
  @ApiResponse({ status: 400, description: "Invalid or expired reset token" })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Get("profile")
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get current user profile",
    description:
      "Retrieve the profile information of the currently authenticated user",
  })
  @ApiResponse({
    status: 200,
    description: "User profile retrieved successfully",
    schema: {
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        data: {
          type: "object",
          properties: {
            user: {
              type: "object",
              properties: {
                id: { type: "string", example: "uuid-here" },
                firstName: { type: "string", example: "John" },
                lastName: { type: "string", example: "Doe" },
                email: { type: "string", example: "john@example.com" },
                phone: { type: "string", example: "+1234567890" },
                isVerified: { type: "boolean", example: true },
                credits: { type: "number", example: 100 },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized - invalid token" })
  async getProfile(@Request() req): Promise<any> {
    const user = await this.authService.getProfile(req.user.id);
    return {
      success: true,
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          isVerified: user.isVerified,
          credits: user.credits,
          balance: user.balance,
          role: user.role,
          adminId: user.adminId,
          costPerMinute: user.costPerMinute,
          adminCredits: (user as any).adminCredits,
          adminBalance: (user as any).adminBalance,
        },
      },
    };
  }
}
