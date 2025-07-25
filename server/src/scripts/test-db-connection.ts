import { DataSource } from "typeorm";
import { config } from "dotenv";

// Load environment variables
config();

async function testConnection() {
  console.log("🔍 Testing database connection...");

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
    console.log("📡 Attempting to connect to database...");
    const options = dataSource.options as any;
    console.log(`Host: ${options.host}`);
    console.log(`Port: ${options.port}`);
    console.log(`Database: ${options.database}`);
    console.log(`Username: ${options.username}`);

    await dataSource.initialize();
    console.log("✅ Database connection successful!");

    // Test basic query
    const result = await dataSource.query("SELECT version()");
    console.log(`🐘 PostgreSQL version: ${result[0].version}`);

    // Check if migrations table exists
    const migrationTableExists = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'migrations'
      );
    `);

    console.log(
      `📋 Migrations table exists: ${migrationTableExists[0].exists}`,
    );

    // If migrations table exists, show migration status
    if (migrationTableExists[0].exists) {
      const migrations = await dataSource.query(
        "SELECT * FROM migrations ORDER BY id DESC LIMIT 5",
      );
      console.log("📝 Recent migrations:");
      migrations.forEach((migration: any) => {
        console.log(
          `  - ${migration.name} (${new Date(parseInt(migration.timestamp)).toISOString()})`,
        );
      });
    }

    await dataSource.destroy();
    console.log("🔌 Database connection closed");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
}

testConnection();
