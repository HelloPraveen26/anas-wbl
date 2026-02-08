import axios from "axios";
import type { AxiosRequestConfig } from "axios";
import * as dotenv from "dotenv";
import { DataSource } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { databaseConfig } from "../config/database.config";
import { CallLog } from "../call-logs/entities/call-log.entity";

dotenv.config();

// Initialize ConfigService
const configService = new ConfigService();

// Get database configuration from centralized config
const dbConfig = databaseConfig(configService);

// Initialize database connection using centralized config
const AppDataSource = new DataSource({
  ...dbConfig,
  // Override job-specific settings
  logging: false, // Keep logging off for the job
  synchronize: false, // Never sync in jobs for safety
} as any);

interface LangfuseResponse {
  data: Array<{
    sessionId: string;
    sum_totalCost: number;
    sum_totalTokens: string;
    sum_latency: string;
  }>;
}

async function getCurrentDateRange(): Promise<{
  fromTimestamp: string;
  toTimestamp: string;
}> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const fromTimestamp = today.toISOString();
  const toTimestamp = new Date(
    today.getTime() + 24 * 60 * 60 * 1000 - 1,
  ).toISOString();

  return { fromTimestamp, toTimestamp };
}

async function callLangfuseAPI(
  sessionId: string,
): Promise<LangfuseResponse | null> {
  try {
    const { fromTimestamp, toTimestamp } = await getCurrentDateRange();

    const options: AxiosRequestConfig = {
      method: "GET",
      url: "http://3.109.60.31:3000/api/public/metrics",
      auth: {
        username: "pk-lf-ebbc73de-87ca-46d9-b584-2b4107d453df",
        password: "sk-lf-9e0edcf3-056e-439d-b64b-6b7ccc9de19d",
      },
      params: {
        query: JSON.stringify({
          view: "traces",
          dimensions: [{ field: "sessionId" }],
          metrics: [
            { measure: "totalCost", aggregation: "sum" },
            { measure: "totalTokens", aggregation: "sum" },
            { measure: "latency", aggregation: "sum" },
          ],
          filters: [
            {
              column: "sessionId",
              operator: "=",
              value: sessionId,
              type: "string",
            },
          ],
          fromTimestamp,
          toTimestamp,
        }),
      },
      paramsSerializer: {
        serialize: (params: Record<string, string>) =>
          Object.entries(params)
            .map(
              ([key, value]) =>
                `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
            )
            .join("&"),
      },
    };

    const { data } = await axios.request(options);
    return data as LangfuseResponse;
  } catch (error: any) {
    console.error(
      `Error calling Langfuse API for session ${sessionId}:`,
      error.response?.data || error.message,
    );
    return null;
  }
}

async function updateCallLog(
  sessionId: string,
  cost: number,
  duration: number,
): Promise<void> {
  try {
    const callLogRepository = AppDataSource.getRepository(CallLog);

    await callLogRepository.update({ sessionId }, { cost, duration });

    console.log(
      `✅ Updated call log for session ${sessionId}: cost=${cost}, duration=${duration}`,
    );
  } catch (error) {
    console.error(`Error updating call log for session ${sessionId}:`, error);
  }
}

async function processCallLog(): Promise<void> {
  try {
    const callLogRepository = AppDataSource.getRepository(CallLog);

    // Find one record where cost = 0
    const callLog = await callLogRepository.findOne({
      where: { cost: 0 },
      select: ["sessionId", "id"],
    });

    if (!callLog || !callLog.sessionId) {
      console.log("No call log found with cost = 0 and valid session_id");
      return;
    }

    console.log(`🔄 Processing session: ${callLog.sessionId}`);

    // Call Langfuse API
    const langfuseData = await callLangfuseAPI(callLog.sessionId);

    if (!langfuseData || !langfuseData.data || langfuseData.data.length === 0) {
      console.log(
        `No data returned from Langfuse for session: ${callLog.sessionId}`,
      );
      return;
    }

    const sessionData = langfuseData.data[0];

    // Extract cost and duration from response
    const cost = sessionData.sum_totalCost || 0;
    const duration = parseInt(sessionData.sum_latency || "0");

    // Update the call log
    await updateCallLog(callLog.sessionId, cost, duration);
  } catch (error) {
    console.error("Error in processCallLog:", error);
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log("🚀 Database connected successfully");
    console.log("🔄 Starting Langfuse sync job...");

    // Run forever with 5-second intervals
    while (true) {
      await processCallLog();
      await sleep(5000); // 5 seconds
    }
  } catch (error) {
    console.error("Fatal error in main:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Received SIGINT, shutting down gracefully...");
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Received SIGTERM, shutting down gracefully...");
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(0);
});

// Start the job
main().catch(console.error);
