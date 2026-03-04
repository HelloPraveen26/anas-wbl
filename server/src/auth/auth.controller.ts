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
import { GoogleAuthGuard } from "./guards/google-auth.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

@ApiTags("auth")
@Controller("auth")
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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

  @Get("google")
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: "Initiate Google OAuth login",
    description: "Redirect to Google OAuth consent screen",
  })
  @ApiResponse({ status: 302, description: "Redirect to Google OAuth" })
  async googleAuth(): Promise<void> {
    // Initiates Google OAuth flow
  }

  @Get("google/callback")
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: "Google OAuth callback",
    description:
      "Handle Google OAuth callback and redirect to frontend with auth token",
  })
  @ApiResponse({
    status: 302,
    description: "Redirect to frontend with auth token",
  })
  async googleAuthCallback(@Request() req, @Response() res): Promise<void> {
    console.log("🔍 Google OAuth callback triggered");
    console.log("📊 Request user data:", JSON.stringify(req.user, null, 2));
    console.log("🌐 Environment - FRONTEND_URL:", process.env.FRONTEND_URL);

    try {
      const authResult = await this.authService.googleLogin(req.user);
      console.log(
        "✅ Google login successful for user:",
        authResult.data.user.email,
      );

      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8001";
      const redirectUrl = `${frontendUrl}/auth/callback?token=${authResult.data.token}`;

      console.log("🔗 Redirecting to:", redirectUrl);
      console.log(
        "🎫 Token (first 20 chars):",
        authResult.data.token.substring(0, 20) + "...",
      );

      res.redirect(redirectUrl);
    } catch (error) {
      console.error("❌ Google OAuth callback error:", error);
      console.error(
        "📋 Error stack:",
        error instanceof Error ? error.stack : "No stack trace",
      );

      // Handle authentication errors by redirecting to login with error message
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8001";
      const errorMessage = encodeURIComponent(
        error instanceof Error ? error.message : "Authentication failed",
      );
      const errorRedirectUrl = `${frontendUrl}/login?error=${errorMessage}`;

      console.log("🔗 Redirecting to error page:", errorRedirectUrl);
      res.redirect(errorRedirectUrl);
    }
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
    return {
      success: true,
      data: { user: req.user },
    };
  }
}
