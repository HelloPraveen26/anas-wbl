import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { EmailService } from './services/email.service';
import { User } from '../users/entities/user.entity';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<AuthResponseDto> {
    this.logger.log(`Sign up attempt for email: ${signUpDto.email}`);

    try {
      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');

      const user = await this.usersService.create({
        ...signUpDto,
        verificationToken,
      });

      // Send verification email (in production)
      if (this.configService.get('NODE_ENV') === 'production') {
        await this.emailService.sendVerificationEmail(user.email, verificationToken);
      } else {
        // Auto-verify in development
        await this.usersService.verifyUser(user.id);
      }

      const token = this.generateJwtToken(user);

      this.logger.log(`User signed up successfully: ${user.id}`);

      return {
        success: true,
        message: 'Account created successfully',
        data: {
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            isVerified: user.isVerified,
          },
          token,
        },
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Sign up failed for ${signUpDto.email}:`, error);
      throw new BadRequestException('Failed to create account');
    }
  }

  async signIn(signInDto: SignInDto): Promise<AuthResponseDto> {
    this.logger.log(`Sign in attempt for email: ${signInDto.email}`);

    const user = await this.validateUser(signInDto.email, signInDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    const token = this.generateJwtToken(user);

    this.logger.log(`User signed in successfully: ${user.id}`);

    return {
      success: true,
      message: 'Sign in successful',
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          isVerified: user.isVerified,
        },
        token,
      },
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Forgot password request for email: ${forgotPasswordDto.email}`);

    const user = await this.usersService.findByEmail(forgotPasswordDto.email);

    // Always return success to prevent email enumeration
    if (!user) {
      return {
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent',
      };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

    await this.usersService.setResetPasswordToken(user.id, resetToken, resetExpires);

    // Send reset email
    try {
      await this.emailService.sendPasswordResetEmail(user.email, resetToken, user.firstName);
      this.logger.log(`Password reset email sent to: ${user.email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${user.email}:`, error);
    }

    return {
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Password reset attempt with token: ${resetPasswordDto.token.substring(0, 8)}...`);

    const user = await this.usersService.findByResetToken(resetPasswordDto.token);

    if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Update password and clear reset token
    await this.usersService.update(user.id, {
      password: resetPasswordDto.password,
    });

    await this.usersService.clearResetPasswordToken(user.id);

    this.logger.log(`Password reset successful for user: ${user.id}`);

    return {
      success: true,
      message: 'Password reset successful',
    };
  }

  async googleLogin(user: User): Promise<AuthResponseDto> {
    this.logger.log(`Google login for user: ${user.id}`);

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    const token = this.generateJwtToken(user);

    return {
      success: true,
      message: 'Google sign in successful',
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          isVerified: user.isVerified,
        },
        token,
      },
    };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);

    if (user && user.password && (await this.usersService.validatePassword(password, user.password))) {
      return user;
    }

    return null;
  }

  private generateJwtToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    return this.jwtService.sign(payload);
  }
}