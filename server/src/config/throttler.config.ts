import { ConfigService } from '@nestjs/config';
import { ThrottlerModuleOptions } from '@nestjs/throttler';

export const throttlerConfig = (configService: ConfigService): ThrottlerModuleOptions => ({
  throttlers: [
    {
      ttl: configService.get('THROTTLE_TTL') * 1000, // Convert to milliseconds
      limit: configService.get('THROTTLE_LIMIT'),
    },
  ],
});