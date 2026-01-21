import { ConfigService } from "@nestjs/config";
import { ThrottlerModuleOptions } from "@nestjs/throttler";

export const throttlerConfig = (
  configService: ConfigService,
): ThrottlerModuleOptions => ({
  throttlers: [
    {
      name: "short",
      ttl: (configService.get("THROTTLE_TTL_SHORT") || 60) * 1000, // 1 minute window
      limit: configService.get("THROTTLE_LIMIT_SHORT") || 200, // 200 requests per minute
    },
    {
      name: "medium",
      ttl: (configService.get("THROTTLE_TTL_MEDIUM") || 300) * 1000, // 5 minute window
      limit: configService.get("THROTTLE_LIMIT_MEDIUM") || 500, // 500 requests per 5 minutes
    },
    {
      name: "long",
      ttl: (configService.get("THROTTLE_TTL_LONG") || 3600) * 1000, // 1 hour window
      limit: configService.get("THROTTLE_LIMIT_LONG") || 2000, // 2000 requests per hour
    },
  ],
  skipIf: (context) => {
    const request = context.switchToHttp().getRequest();
    // Skip throttling for health checks and internal requests
    return (
      request.url?.includes("/health") ||
      request.headers["user-agent"]?.includes("ELB-HealthChecker")
    );
  },
});
