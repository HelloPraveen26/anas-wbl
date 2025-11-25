import { DataSource } from "typeorm";
import { config } from "dotenv";

// Load environment variables
config();

async function resetDatabase() {
  console.log("🗑️  Starting database reset...");

  const dataSource = new DataSource({
    type: "postgres",
    host: process.env.DATABASE_HOST || "localhost",
    port: parseInt(process.env.DATABASE_PORT || "5432"),
    username: process.env.DATABASE_USERNAME || "postgres",
    password: process.env.DATABASE_PASSWORD || "password",
    database: process.env.DATABASE_NAME || "zenvoice",
    logging: true,
  });

  try {
    console.log("📡 Connecting to database...");
    await dataSource.initialize();
    console.log("✅ Connected to database");

    console.log("🔍 Checking existing tables...");
    const tables = await dataSource.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    if (tables.length > 0) {
      console.log("📋 Found existing tables:");
      tables.forEach((table: any) => {
        console.log(`  - ${table.table_name}`);
      });

      console.log("🗑️  Dropping all tables...");

      // Drop tables in the correct order to avoid foreign key constraints
      const tablesToDrop = [
        "assistants",
        "synthesizer_models",
        "synthesizer_providers",
        "transcriber_models",
        "transcriber_providers",
        "llm_models",
        "llm_providers",
        "users",
        "migrations",
      ];

      for (const tableName of tablesToDrop) {
        try {
          await dataSource.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
          console.log(`  ✅ Dropped table: ${tableName}`);
        } catch (error) {
          console.log(
            `  ⚠️  Table ${tableName} might not exist: ${(error as Error).message}`,
          );
        }
      }

      // Drop any remaining tables that might exist
      const remainingTables = await dataSource.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `);

      for (const table of remainingTables) {
        try {
          await dataSource.query(
            `DROP TABLE IF EXISTS "${table.table_name}" CASCADE`,
          );
          console.log(`  ✅ Dropped remaining table: ${table.table_name}`);
        } catch (error) {
          console.log(
            `  ⚠️  Could not drop table ${table.table_name}: ${(error as Error).message}`,
          );
        }
      }
    } else {
      console.log("📭 No tables found in database");
    }

    console.log("🔍 Checking for existing extensions...");
    const extensions = await dataSource.query(`
      SELECT extname
      FROM pg_extension
      WHERE extname = 'uuid-ossp';
    `);

    if (extensions.length === 0) {
      console.log("🔧 Creating uuid-ossp extension...");
      await dataSource.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      console.log("✅ Extension created");
    } else {
      console.log("✅ Extension uuid-ossp already exists");
    }

    // Drop any existing types that might conflict
    console.log("🗑️  Dropping existing custom types...");
    try {
      await dataSource.query(
        'DROP TYPE IF EXISTS "auth_provider_enum" CASCADE',
      );
      console.log("  ✅ Dropped auth_provider_enum type");
    } catch (error) {
      console.log("  ⚠️  Type auth_provider_enum might not exist");
    }

    console.log("🧹 Database reset completed successfully!");
    console.log("");
    console.log("🚀 Next steps:");
    console.log("  1. Run: npm run migration:run");
    console.log("  2. Run: npm run seed (optional)");
    console.log("  3. Start your application");

    await dataSource.destroy();
    console.log("🔌 Database connection closed");
  } catch (error) {
    console.error("❌ Database reset failed:", error);
    await dataSource.destroy();
    process.exit(1);
  }
}

// Run the reset if this script is executed directly
if (require.main === module) {
  resetDatabase();
}

export { resetDatabase };
