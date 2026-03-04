import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback } from "passport-google-oauth20";
import { ConfigService } from "@nestjs/config";
import { UsersService } from "../../users/users.service";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    const callbackURL = configService.get("GOOGLE_CALLBACK_URL");
    console.log("🔧 Google OAuth Strategy initialized");
    console.log("📍 Callback URL:", callbackURL);
    console.log(
      "🔑 Client ID configured:",
      !!configService.get("GOOGLE_CLIENT_ID"),
    );

    super({
      clientID: configService.get("GOOGLE_CLIENT_ID"),
      clientSecret: configService.get("GOOGLE_CLIENT_SECRET"),
      callbackURL: callbackURL,
      scope: ["email", "profile"],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    console.log("🔐 Google OAuth validate called");
    console.log("👤 Profile ID:", profile.id);
    console.log("📧 Email:", profile.emails?.[0]?.value);
    console.log("👨‍💼 Name:", profile.displayName);

    try {
      // Check if user already exists with Google ID
      let user = await this.usersService.findByGoogleId(profile.id);

      if (!user) {
        console.log("ℹ️ User not found by Google ID, checking by email...");
        // Check if user exists with same email
        user = await this.usersService.findByEmail(profile.emails[0].value);

        if (user) {
          console.log("🔗 Linking Google account to existing user:", user.id);
          // Link Google account to existing user
          await this.usersService.update(user.id, {
            googleId: profile.id,
            profilePicture: profile.photos?.[0]?.value,
          });
        } else {
          console.log("✨ Creating new user from Google profile");
          // Create new user
          user = await this.usersService.createGoogleUser(profile);
          console.log("✅ New user created:", user.id);
        }
      } else {
        console.log("✅ Existing user found by Google ID:", user.id);
      }

      console.log(
        "🎉 Google OAuth validation successful for user:",
        user.email,
      );
      done(null, user);
    } catch (error) {
      console.error("❌ Google OAuth validation error:", error);
      console.error(
        "📋 Error details:",
        error instanceof Error ? error.message : String(error),
      );
      done(error, null);
    }
  }
}
