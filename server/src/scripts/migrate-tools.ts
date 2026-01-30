import { AppDataSource } from "../database/data-source";
import { ToolConfig } from "../assistant/entities/tool-config.entity";
import { promises as fs } from "fs";
import { join } from "path";

async function migrate() {
    try {
        console.log("🚀 Starting migration: JSON Files -> Database");

        // 1. Initialize Database
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
            console.log("✅ Database initialized");
        }

        const toolRepo = AppDataSource.getRepository(ToolConfig);
        const configDir = join(process.cwd(), "assistant_configs");

        // 2. Check if directory exists
        try {
            await fs.access(configDir);
        } catch {
            console.log("ℹ️ No assistant_configs directory found. Nothing to migrate.");
            process.exit(0);
        }

        // 3. Read all files
        const files = await fs.readdir(configDir);
        let totalMigrated = 0;

        for (const file of files) {
            if (!file.endsWith(".json")) continue;

            const assistantId = file.replace(".json", "");
            const filePath = join(configDir, file);
            const content = await fs.readFile(filePath, "utf-8");
            const tools = JSON.parse(content);

            // Handle both old format (single tool) and new format (array)
            const toolList = Array.isArray(tools) ? tools : [tools];

            for (const tool of toolList) {
                if (!tool.toolName) continue;

                // Check if exists
                let dbTool = await toolRepo.findOne({
                    where: { assistantId, toolName: tool.toolName },
                });

                if (dbTool) {
                    console.log(`📝 Updating existing tool: ${tool.toolName} (Assistant: ${assistantId})`);
                } else {
                    console.log(`➕ Inserting new tool: ${tool.toolName} (Assistant: ${assistantId})`);
                    dbTool = toolRepo.create({ assistantId, toolName: tool.toolName });
                }

                dbTool.description = tool.description;
                dbTool.webhookUrl = tool.webhookUrl;
                dbTool.timeout = tool.timeout || 20;
                dbTool.isAsync = tool.isAsync ?? true;
                dbTool.isStrict = tool.isStrict ?? true;
                dbTool.parameters = tool.parameters || {};
                dbTool.httpHeaders = tool.httpHeaders || {};
                dbTool.conditions = tool.conditions || [];

                await toolRepo.save(dbTool);
                totalMigrated++;
            }
        }

        console.log("=============================================");
        console.log(`✅ Migration complete!`);
        console.log(`📊 Total tools migrated: ${totalMigrated}`);
        console.log("=============================================");

        process.exit(0);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

migrate();
