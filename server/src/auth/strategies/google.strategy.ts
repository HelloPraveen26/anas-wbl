import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      // Check if user already exists with Google ID
      let user = await this.usersService.findByGoogleId(profile.id);

      if (!user) {
        // Check if user exists with same email
        user = await this.usersService.findByEmail(profile.emails[0].value);

        if (user) {
          // Link Google account to existing user
          await this.usersService.update(user.id, {
            googleId: profile.id,
            profilePicture: profile.photos?.[0]?.value,
          });
        } else {
          // Create new user
          user = await this.usersService.createGoogleUser(profile);
        }
      }

      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
}